import { format } from 'timeago.js'

export function formatTime(timestamp: number) {
    if (timestamp > 10_000_000_000) {
        return format(timestamp)
    } else {
        return format(timestamp * 1000)
    }
}