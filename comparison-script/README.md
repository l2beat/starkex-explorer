# How to use compare.py script

1. Create a file containing the URLs you want to monitor, one per line, e.g., `urls.txt`:
```
/index.html
/js/main.js
/about.html
```

2. Optionally, create a file containing headers, one per line in `Key: Value` format, e.g., `headers.txt`:
```
Cookie: session=abc123
Authorization: Bearer xyz789
```

3. Run the script:
```bash
python3 compare.py --prod https://production.example.com --local http://localhost:8080 --urls urls.txt --interval 30 --headers headers.txt
```

Key features of the script:

- Compares URLs one by one between production and local deployments
- Shows detailed diffs when discrepancies are found using Python's difflib
- Configurable check interval (defaults to 60 seconds)
- Custom headers support for authenticated requests
- Error handling for failed downloads
- Clean output with timestamps
- Can be stopped with Ctrl+C

The script will:
1. Load the configuration and headers
2. For each URL in your list:
   - Download from both production and local
   - Compare contents
   - Show detailed diffs if there are discrepancies
3. Wait for the specified interval
4. Repeat

The diff output uses the unified diff format, which is easy to read and similar to git diffs.
