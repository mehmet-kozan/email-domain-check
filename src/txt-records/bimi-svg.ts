/** biome-ignore-all lint/suspicious/noImplicitAnyLet: xml parser */
/** biome-ignore-all lint/suspicious/noExplicitAny:  xml parser */
import { XMLParser } from 'fast-xml-parser';

// Profile and Version:
// version="1.2" is required.
// baseProfile="tiny-ps" is required.
// Content Restrictions:
// Must not contain scripts, animations, or interactive elements.
// Must not reference external resources (external links/references).
// The <svg> root element must not have x= and y= attributes.
// File Structure:
// File size must not exceed 32 KB.
// Must contain a <title> element (reflecting your brand name).
// The image must be in square format.
// Background should not be transparent; it should be a solid color (may cause issues in some clients).

export function checkBimiSvg(data: Buffer<ArrayBuffer>): boolean {
	// File size must not exceed 32 KB.
	if (data.length > 32 * 1024) {
		return false;
	}

	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		allowBooleanAttributes: true,
	});

	let jsonObj;
	try {
		jsonObj = parser.parse(data);
	} catch {
		return false;
	}

	const svg = jsonObj.svg;
	if (!svg) {
		return false;
	}

	// Profile and Version:
	// version="1.2" is required.
	if (svg['@_version'] !== '1.2') {
		return false;
	}
	// baseProfile="tiny-ps" is required.
	if (svg['@_baseProfile'] !== 'tiny-ps') {
		return false;
	}

	// The <svg> root element must not have x= and y= attributes.
	if (svg['@_x'] !== undefined || svg['@_y'] !== undefined) {
		return false;
	}

	// Must contain a <title> element (reflecting your brand name).
	if (!svg.title || (typeof svg.title !== 'string' && typeof svg.title !== 'number')) {
		// fast-xml-parser might return an object if title has attributes, or just the text content.
		// If it's strictly required to be non-empty text:
		if (!svg.title) return false;
	}

	// Content Restrictions:
	// Must not contain scripts, animations, or interactive elements.
	const forbiddenTags = ['script', 'animate', 'animateColor', 'animateMotion', 'animateTransform', 'set', 'a', 'foreignObject'];

	// Helper function to traverse the object and check for forbidden keys or external references
	function hasForbiddenContent(obj: any): boolean {
		if (typeof obj !== 'object' || obj === null) {
			return false;
		}

		for (const key in obj) {
			if (forbiddenTags.includes(key)) {
				return true;
			}

			// Check for external references in attributes (e.g., href, xlink:href)
			if (key.startsWith('@_')) {
				const attrName = key.substring(2);
				if (attrName === 'href' || attrName === 'xlink:href' || attrName.endsWith(':href')) {
					const val = obj[key];
					if (typeof val === 'string') {
						const lowerVal = val.trim().toLowerCase();
						if (lowerVal.startsWith('http:') || lowerVal.startsWith('https:') || lowerVal.startsWith('//')) {
							return true;
						}
					}
				}
			}

			if (typeof obj[key] === 'object') {
				if (hasForbiddenContent(obj[key])) {
					return true;
				}
			}
		}
		return false;
	}

	if (hasForbiddenContent(svg)) {
		return false;
	}

	return true;
}
