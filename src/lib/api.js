// Client-side helper: downscale the uploaded file, convert to base64, and call
// the serverless extractor. Downscaling keeps us comfortably under Vercel's body
// limit and speeds up the upload during a live demo.

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function downscaleImage(file) {
  const dataUrl = await fileToDataUrl(file)
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = dataUrl
  })

  let { width, height } = img
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  width = Math.round(width * scale)
  height = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  const out = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  return { dataUrl: out, mimeType: 'image/jpeg' }
}

// Returns { imageBase64, mimeType } ready for the API.
export async function prepareFile(file) {
  if (file.type === 'application/pdf') {
    const dataUrl = await fileToDataUrl(file)
    return { imageBase64: dataUrl.split(',')[1], mimeType: 'application/pdf' }
  }
  const { dataUrl, mimeType } = await downscaleImage(file)
  return { imageBase64: dataUrl.split(',')[1], mimeType }
}

export async function extractBill(file) {
  const { imageBase64, mimeType } = await prepareFile(file)
  const resp = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  })

  if (!resp.ok) {
    let message = 'Extraction failed. Please try again.'
    try {
      const data = await resp.json()
      if (data && data.error) message = data.error
    } catch {
      /* ignore */
    }
    const err = new Error(message)
    err.status = resp.status
    throw err
  }

  return resp.json()
}

// Layer 3 — fetch labeled AI market estimates for uncoded lines. Best-effort: any
// failure resolves to an empty list so the deterministic audit is never blocked.
export async function estimateMarketRates(items, countryName, currencyCode) {
  if (!Array.isArray(items) || items.length === 0) return []
  try {
    const resp = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, countryName, currencyCode }),
    })
    if (!resp.ok) return []
    const data = await resp.json()
    return Array.isArray(data.estimates) ? data.estimates : []
  } catch {
    return []
  }
}
