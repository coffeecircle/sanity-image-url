import parseAssetId from './parseAssetId'
import parseSource from './parseSource'
import {
  CropSpec,
  HotspotSpec,
  ImageUrlBuilderOptions,
  ImageUrlBuilderOptionsWithAsset,
  SanityAsset,
  SanityImageFitResult,
  SanityImageRect,
  SanityReference,
} from './types'

export const SPEC_NAME_TO_URL_NAME_MAPPINGS = [
  ['width', 'w'],
  ['height', 'h'],
  ['format', 'fm'],
  ['download', 'dl'],
  ['blur', 'blur'],
  ['sharpen', 'sharp'],
  ['invert', 'invert'],
  ['orientation', 'or'],
  ['minHeight', 'min-h'],
  ['maxHeight', 'max-h'],
  ['minWidth', 'min-w'],
  ['maxWidth', 'max-w'],
  ['quality', 'q'],
  ['fit', 'fit'],
  ['crop', 'crop'],
  ['saturation', 'sat'],
  ['auto', 'auto'],
  ['dpr', 'dpr'],
  ['pad', 'pad'],
  ['frame', 'frame']
]

export default function urlForImage(options: ImageUrlBuilderOptions): string {
  let spec = {...(options || {})}
  const source = spec.source
  delete spec.source

  const image = parseSource(source)
  if (!image) {
    throw new Error(`Unable to resolve image URL from source (${JSON.stringify(source)})`)
  }

  const id = (image.asset as SanityReference)._ref || (image.asset as SanityAsset)._id || ''
  const asset = parseAssetId(id)

  // Compute crop rect in terms of pixel coordinates in the raw source image
  const cropLeft = Math.round(image.crop.left * asset.width)
  const cropTop = Math.round(image.crop.top * asset.height)
  const crop = {
    left: cropLeft,
    top: cropTop,
    width: Math.round(asset.width - image.crop.right * asset.width - cropLeft),
    height: Math.round(asset.height - image.crop.bottom * asset.height - cropTop),
  }

  // Compute hot spot rect in terms of pixel coordinates
  const hotSpotVerticalRadius = (image.hotspot.height * asset.height) / 2
  const hotSpotHorizontalRadius = (image.hotspot.width * asset.width) / 2
  const hotSpotCenterX = image.hotspot.x * asset.width
  const hotSpotCenterY = image.hotspot.y * asset.height
  const hotspot = {
    left: hotSpotCenterX - hotSpotHorizontalRadius,
    top: hotSpotCenterY - hotSpotVerticalRadius,
    right: hotSpotCenterX + hotSpotHorizontalRadius,
    bottom: hotSpotCenterY + hotSpotVerticalRadius,
  }

  // If irrelevant, or if we are requested to: don't perform crop/fit based on
  // the crop/hotspot.
  if (!(spec.rect || spec.focalPoint || spec.ignoreImageParams || spec.crop)) {
    spec = {...spec, ...fit({crop, hotspot}, spec)}
  }

  return specToImageUrl({...spec, asset})
}

// eslint-disable-next-line complexity
function specToImageUrl(spec: ImageUrlBuilderOptionsWithAsset) {
  const cdnUrl = (spec.baseUrl || 'https://cdn.sanity.io').replace(/\/+$/, '')
  const filename = `${spec.asset.id}-${spec.asset.width}x${spec.asset.height}.${spec.asset.format}`
  const baseUrl = `${cdnUrl}/${spec.asset.id}/` 

  const params = []

  // TODO: map more options to Uploadcare syntax
  if (spec.width && spec.height) {
    params.push(`scale_crop/${spec.width * (spec.dpr || 1)}x${spec.height * (spec.dpr || 1)}/smart`)
  }

  if (params.length === 0) {
    return `${baseUrl}image-${filename}`
  }

  return `${baseUrl}-/${params.join('/')}/image-${filename}`
}

function fit(
  source: {crop: CropSpec; hotspot: HotspotSpec},
  spec: ImageUrlBuilderOptions
): SanityImageFitResult {
  let cropRect: SanityImageRect

  const imgWidth = spec.width
  const imgHeight = spec.height

  // If we are not constraining the aspect ratio, we'll just use the whole crop
  if (!(imgWidth && imgHeight)) {
    return {width: imgWidth, height: imgHeight, rect: source.crop}
  }

  const crop = source.crop
  const hotspot = source.hotspot

  // If we are here, that means aspect ratio is locked and fitting will be a bit harder
  const desiredAspectRatio = imgWidth / imgHeight
  const cropAspectRatio = crop.width / crop.height

  if (cropAspectRatio > desiredAspectRatio) {
    // The crop is wider than the desired aspect ratio. That means we are cutting from the sides
    const height = Math.round(crop.height)
    const width = Math.round(height * desiredAspectRatio)
    const top = Math.max(0, Math.round(crop.top))

    // Center output horizontally over hotspot
    const hotspotXCenter = Math.round((hotspot.right - hotspot.left) / 2 + hotspot.left)
    let left = Math.max(0, Math.round(hotspotXCenter - width / 2))

    // Keep output within crop
    if (left < crop.left) {
      left = crop.left
    } else if (left + width > crop.left + crop.width) {
      left = crop.left + crop.width - width
    }

    cropRect = {left, top, width, height}
  } else {
    // The crop is taller than the desired ratio, we are cutting from top and bottom
    const width = crop.width
    const height = Math.round(width / desiredAspectRatio)
    const left = Math.max(0, Math.round(crop.left))

    // Center output vertically over hotspot
    const hotspotYCenter = Math.round((hotspot.bottom - hotspot.top) / 2 + hotspot.top)
    let top = Math.max(0, Math.round(hotspotYCenter - height / 2))

    // Keep output rect within crop
    if (top < crop.top) {
      top = crop.top
    } else if (top + height > crop.top + crop.height) {
      top = crop.top + crop.height - height
    }

    cropRect = {left, top, width, height}
  }

  return {
    width: imgWidth,
    height: imgHeight,
    rect: cropRect,
  }
}

// For backwards-compatibility
export {parseSource}
