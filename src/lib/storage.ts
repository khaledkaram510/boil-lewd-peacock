// Type definitions for highlight objects
import type { Highlight } from "./types"

// localStorage key for storing all highlights
const STORAGE_KEY = "text_highlights"

/**
 * HighlightStorage Class
 *
 * A utility class providing static methods for managing highlight persistence
 * using the browser's localStorage API. This class handles all CRUD operations
 * for highlight data, ensuring data consistency and providing type safety.
 *
 * All data is stored as JSON in localStorage under a single key for simplicity.
 * The class includes methods for saving, retrieving, updating, and deleting highlights.
 */
export class HighlightStorage {
  /**
   * Saves a new highlight to localStorage
   * Appends the highlight to the existing array of highlights
   *
   * @param {Highlight} highlight - The highlight object to save
   */
  static save(highlight: Highlight): void {
    const highlights = this.getAll()
    highlights.push(highlight)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights))
  }

  /**
   * Retrieves all highlights from localStorage
   * Returns an empty array if no highlights exist
   *
   * @returns {Highlight[]} Array of all saved highlights
   */
  static getAll(): Highlight[] {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  /**
   * Retrieves highlights filtered by URL
   * Useful for showing only highlights relevant to the current page
   *
   * @param {string} url - The URL to filter highlights by
   * @returns {Highlight[]} Array of highlights for the specified URL
   */
  static getByUrl(url: string): Highlight[] {
    return this.getAll().filter((h) => h.url === url)
  }

  /**
   * Deletes a highlight by its unique ID
   * Removes the highlight from the array and updates localStorage
   *
   * @param {string} id - The unique ID of the highlight to delete
   */
  static delete(id: string): void {
    const highlights = this.getAll().filter((h) => h.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights))
  }

  /**
   * Updates an existing highlight with partial data
   * Finds the highlight by ID and merges the updates with existing data
   *
   * @param {string} id - The unique ID of the highlight to update
   * @param {Partial<Highlight>} updates - The partial data to merge with existing highlight
   */
  static update(id: string, updates: Partial<Highlight>): void {
    const highlights = this.getAll()
    const index = highlights.findIndex((h) => h.id === id)
    if (index !== -1) {
      highlights[index] = { ...highlights[index], ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights))
    }
  }
}

/**
 * Generates an XPath expression for a given DOM node
 *
 * XPath provides a reliable way to locate elements even after page changes.
 * This function creates a path from the root document to the target element
 * by traversing up the DOM tree and noting each element's position among siblings.
 *
 * The generated XPath format: /html[1]/body[1]/div[2]/p[1]
 * Numbers indicate the element's position among same-type siblings.
 *
 * @param {Node} element - The DOM node to generate XPath for
 * @returns {string} The XPath expression as a string
 */
export function generateXPath(element: Node): string {
  // Handle text nodes by getting their parent element
  if (element.nodeType === Node.TEXT_NODE) {
    element = element.parentNode!
  }

  // Only process element nodes
  if (element.nodeType !== Node.ELEMENT_NODE) {
    return ""
  }

  const xpath: string[] = []
  let current = element as Element

  // Traverse up the DOM tree to build the path
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling = current.previousSibling

    // Count same-name siblings that come before this element
    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        sibling.nodeName === current.nodeName
      ) {
        index++
      }
      sibling = sibling.previousSibling
    }

    // Build path segment: tagname[position]
    const tagName = current.nodeName.toLowerCase()
    xpath.unshift(`${tagName}[${index}]`)
    current = current.parentNode as Element
  }

  // Return complete XPath starting with root slash
  return `/${xpath.join("/")}`
}

/**
 * Retrieves a DOM element using an XPath expression
 *
 * This function uses the browser's native XPath evaluation capabilities
 * to find an element based on its XPath string. It returns the first
 * matching element or null if no element is found.
 *
 * This is particularly useful for restoring highlights after page loads
 * when we need to find previously highlighted elements.
 *
 * @param {string} xpath - The XPath expression to evaluate
 * @returns {Element | null} The matching DOM element or null if not found
 */
export function getElementByXPath(xpath: string): Element | null {
  return document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue as Element
}
