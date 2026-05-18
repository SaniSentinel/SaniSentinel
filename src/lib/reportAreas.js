import { extractSMSInfo } from './inbound-sms'

/**
 * Local area label for a facility within its district (e.g. "Central Market Public Toilet" in Tamale).
 */
export function deriveAreaLabel(facilityName, districtName) {
  if (!facilityName) return 'Unknown'
  const name = facilityName.trim()
  if (!districtName) return name

  const prefix = `${districtName.trim()} `
  if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
    const stripped = name.slice(prefix.length).trim()
    return stripped || name
  }
  return name
}

/** Area shown in reports UI: SMS block/section when present, otherwise facility area label. */
export function getReportAreaLabel(report) {
  const facility = report?.facility
  const districtName = facility?.district?.name
  const sms = extractSMSInfo(report?.notes || '')
  if (sms.block) {
    return sms.block
  }
  return deriveAreaLabel(facility?.name, districtName)
}

export function buildAreaOptionsFromFacilities(facilityRows = []) {
  const areas = new Set()
  facilityRows.forEach((row) => {
    const label = deriveAreaLabel(row.name, row.district?.name)
    if (label && label !== 'Unknown') areas.add(label)
  })
  return Array.from(areas).sort((a, b) => a.localeCompare(b))
}
