export function formatDateTime(value) { if (!value) {
    return '';
} const date = new Date(value); if (Number.isNaN(date.getTime())) {
    return value;
} return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul', }).format(date); }
export function formatDate(value) { if (!value) {
    return '';
} const date = new Date(value); if (Number.isNaN(date.getTime())) {
    return value;
} return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul', }).format(date); }
export function toSeoulDateKey(value = null) { const date = value ? new Date(value) : new Date(); return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date); }

