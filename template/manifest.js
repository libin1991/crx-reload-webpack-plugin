module.exports = {
	name: "Test",
	"version": "1.0.0",
	"description": "This is a test extension.",
	"manifest_version": 2,
	"icons": {
		"16": "images/icon/test_16.png",
		"32": "images/icon/test_32.png",
		"48": "images/icon/test_48.png",
		"64": "images/icon/test_64.png"
	},
	"browser_action": {
		"default_icon": {
			"16": "images/icon/test_16.png",
			"32": "images/icon/test_32.png",
			"48": "images/icon/test_48.png",
			"64": "images/icon/test_64.png"
		},
		"default_title": "Test",
		"default_popup": "popup/popup.html"
	},
	"author": "test",
	"background": {
		"scripts": ["background/background.js"],
		"persistent": false
	},
	"options_page": "options/options.html",
	"content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_start"
    }
  ],
	"permissions": [],
	"web_accessible_resources": ["images/*"],
	"content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'"
}