interface NotifyPayload {
  title: string
  message: string
  priority?: number // 1=min 2=low 3=default 4=high 5=urgent
  tags?: string[]
}

export async function sendMedicationAlert(payload: NotifyPayload): Promise<void> {
  const ntfyUrl = process.env.NTFY_URL ?? 'http://ntfy:8080'
  const topic = 'red-panda-den-medication'

  const response = await fetch(`${ntfyUrl}/${topic}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      title: payload.title,
      message: payload.message,
      priority: payload.priority ?? 3,
      tags: payload.tags ?? [],
    }),
  })

  if (!response.ok) {
    throw new Error(`Ntfy responded ${response.status}: ${response.statusText}`)
  }
}
