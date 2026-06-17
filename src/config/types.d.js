/**
 * @typedef {Object} Bookmark
 * @property {string} id
 * @property {string} title
 * @property {string} url
 * @property {string} username
 * @property {string|{iv:number[],data:number[],salt:number[],encrypted:true}} password
 * @property {string} notes
 * @property {string} icon
 * @property {string} categoryId
 * @property {string|null} parentId
 * @property {number} order
 * @property {number} useCount
 * @property {Record<string,boolean>} attributes
 * @property {boolean} isExpanded
 * @property {number} createdAt
 */

/**
 * @typedef {Object} SiblingGroup
 * @property {string} id
 * @property {string} name
 * @property {string} categoryId
 * @property {string} icon
 * @property {number} order
 * @property {boolean} isExpanded
 * @property {Record<string,boolean>} attributes
 * @property {string[]} bookmarkIds
 * @property {string} notes - HTML content from TipTap editor
 * @property {number} updatedAt
 * @property {number} useCount
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} color
 */

/**
 * @typedef {Object} CustomAttribute
 * @property {string} id
 * @property {string} name
 * @property {'boolean'} type
 */

/**
 * @typedef {Object} AppData
 * @property {Bookmark[]} bookmarks
 * @property {SiblingGroup[]} siblingGroups
 * @property {Category[]} categories
 * @property {CustomAttribute[]} customAttributes
 */
