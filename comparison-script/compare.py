#!/usr/bin/env python3

import requests
import hashlib
import time
import difflib
from typing import List, Dict, Optional
from dataclasses import dataclass
from urllib.parse import urljoin
import argparse
import sys
from datetime import datetime

@dataclass
class ComparisonConfig:
    prod_host: str
    local_host: str
    urls: List[str]
    interval: int
    headers: Dict[str, str]
    discord_webhook: Optional[str] = None

class WebComparator:
    def __init__(self, config: ComparisonConfig):
        self.config = config
        self.session = requests.Session()
        
    def get_full_url(self, base_url: str, path: str) -> str:
        return urljoin(base_url, path)
    
    def download_content(self, url: str) -> Optional[str]:
        try:
            response = self.session.get(url, headers=self.config.headers)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Error downloading {url}: {str(e)}")
            return None
    
    def calculate_checksum(self, content: str) -> str:
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def compare_contents(self, prod_content: str, local_content: str, url: str) -> bool:
        if prod_content == local_content:
            return True
        
        # Generate diff
        prod_lines = prod_content.splitlines(keepends=True)
        local_lines = local_content.splitlines(keepends=True)
        
        diff = list(difflib.unified_diff(
            local_lines,
            prod_lines,
            fromfile='local',
            tofile='production',
            n=3  # Context lines
        ))
        
        if diff:
            message = f"Test message! IGNORE! Discrepancy found for URL: {url} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            self.notify_discord(message)
            print(f"\n{'='*80}")
            print(f"Discrepancy found for URL: {url}")
            print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*80}")
            sys.stdout.writelines(diff)
            print(f"{'='*80}")
        
        return False
    
    def compare_url(self, url: str) -> bool:
        prod_url = self.get_full_url(self.config.prod_host, url)
        local_url = self.get_full_url(self.config.local_host, url)
        
        print(f"Comparing {url}...")
        
        prod_content = self.download_content(prod_url)
        if prod_content is None:
            self.notify_discord(f"Error downloading {prod_url}")
            return False
        prod_content = prod_content.replace('>', '>\n')
            
        local_content = self.download_content(local_url)

        if local_content is None:
            self.notify_discord(f"Error downloading {local_url}")
            return False
        local_content = local_content.replace('>', '>\n')
        
        return self.compare_contents(prod_content, local_content, url)
    
    def run_comparison(self) -> None:
        all_match = True
        for url in self.config.urls:
            if not self.compare_url(url):
                all_match = False
        
        if all_match:
            print("\nAll files match! ✓")
        else:
            print("\nSome URLS do not match! ✗")
        
    def monitor(self) -> None:
        while True:
            print(f"\nStarting comparison at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            self.run_comparison()
            time.sleep(self.config.interval)

    def notify_discord(self, message: str) -> None:
        if not self.config.discord_webhook:
            return
            
        try:
            discord_payload = {"content": message}
            response = self.session.post(
                self.config.discord_webhook,
                json=discord_payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"Error sending Discord notification: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Compare web deployments')
    parser.add_argument('--prod', required=True, help='Production host URL')
    parser.add_argument('--local', required=True, help='Local host URL')
    parser.add_argument('--urls', required=True, help='File containing URLs to compare (one per line)')
    parser.add_argument('--interval', type=int, default=60, help='Check interval in seconds')
    parser.add_argument('--headers', help='File containing headers in Key: Value format (one per line)')
    parser.add_argument('--discord-webhook', help='Discord webhook URL for notifications')
    
    args = parser.parse_args()
    
    # Read URLs
    try:
        with open(args.urls, 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Error: URLs file {args.urls} not found")
        sys.exit(1)
    
    # Read headers if provided
    headers = {}
    if args.headers:
        try:
            with open(args.headers, 'r') as f:
                for line in f:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        headers[key.strip()] = value.strip()
        except FileNotFoundError:
            print(f"Error: Headers file {args.headers} not found")
            sys.exit(1)
    
    config = ComparisonConfig(
        prod_host=args.prod,
        local_host=args.local,
        urls=urls,
        interval=args.interval,
        headers=headers,
        discord_webhook=args.discord_webhook
    )
    
    comparator = WebComparator(config)
    
    try:
        comparator.monitor()
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user")
        sys.exit(0)

if __name__ == '__main__':
    main()
