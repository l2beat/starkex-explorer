import { format } from 'timeago.js'

export function formatTime(timestamp: number) {
    return format(timestamp)
}