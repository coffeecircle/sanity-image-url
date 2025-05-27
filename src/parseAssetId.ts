const example = 'image-f47ac10b-58cc-4372-a567-0e02b2c3d479-2000x3000-jpg'

export default function parseAssetId(ref: string) {
  const [, p1, p2, p3, p4, p5, dimensionString, format] = ref.split('-')

  const id = `${p1}-${p2}-${p3}-${p4}-${p5}`

  if (!id || !dimensionString || !format) {
    throw new Error(`Malformed asset _ref '${ref}'. Expected an id like "${example}".`)
  }

  const [imgWidthStr, imgHeightStr] = dimensionString.split('x')

  const width = +imgWidthStr
  const height = +imgHeightStr

  const isValidAssetId = isFinite(width) && isFinite(height)
  if (!isValidAssetId) {
    throw new Error(`Malformed asset _ref '${ref}'. Expected an id like "${example}".`)
  }

  return {id, width, height, format}
}
