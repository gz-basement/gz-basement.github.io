/*
			Gallery Load script for PhotoSwipe 4.1.3
					Version 1.1		July 2019
						by Graham O'Neill
*/

var nextGid = 1;

// =======================================================================
// Open a new gallery and (usually, but optionally) get Items from page
// =======================================================================

gallery = function (galleryIdOrClass, getItems=true) {
	this.galleryName = galleryIdOrClass;
	this.gid = nextGid;
	this.nextPid = 1;
	this.pswpElement = document.querySelectorAll('.pswp')[0];
	this.options = [];
	this.items = [];
	nextGid++;

	var	self = this,
			sectionHeader = document.querySelectorAll(this.galleryName);

	// Init DIV (or whatever) for gallery GID
	for (var i=0, ln=sectionHeader.length; i<ln; i++) {
		sectionHeader[i].setAttribute('data-gid', this.gid);
		sectionHeader[i].onclick = onThumbnailsClick.bind(this);
	}

	// Init OPTIONS array
	this.options = {

		galleryUID: this.gid,
		galleryPIDs: true,

		// See Options -> getThumbBoundsFn section of documentation for more info
		getThumbBoundsFn: function(index) {
			var	thumbnail = self.items[index].el,
					rect = thumbnail.getBoundingClientRect(),
					pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
			return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
		}
	};

	// Init ITEMS array
	if (getItems) this.initItems();
}

// -----------------------------------------------------------------------
// Load Items from page after (optionally) clearing data from a previous load
// -----------------------------------------------------------------------

gallery.prototype.initItems = function (resetItems=false) {
	var	sectionHeader = document.querySelectorAll(this.galleryName),
			ln = sectionHeader.length;

	if (resetItems) {
		this.nextPid = 1;
		this.items = [];
		for (var i=0; i<ln; i++) {
			this._clearFromDOM(sectionHeader[i]);
		}
	}

	for (var i=0; i<ln; i++) {
		this._getFromDOM(sectionHeader[i]);
	}
}

gallery.prototype._getFromDOM = function (node) {
	var	dataSize,
			picSrc, picMsrc, picSizes, picCapt, picPid, picNode,
			picItem,
			stack, stkNode;

	if (node.nodeType === 1) {

		dataSize = node.getAttribute('data-size');
		if (dataSize !== null && dataSize !== '') {

			// Set element index starting at 0
			node.setAttribute('data-indx',this.nextPid-1);

			// Add to ITEMS array
			picSizes = dataSize.split('x');

			picCapt = node.getAttribute('data-capt');

			picPid = node.getAttribute('data-pid');
			if (picPid === null || picPid === '') {
				picPid = this.nextPid.toString(10);
			}

			picNode = node;
			if (node.tagName === 'IMG') {
				picSrc = node.getAttribute('src');
				picMsrc = picSrc;
			} else {
				if (node.tagName === 'A') {
					picSrc = node.getAttribute('href');
				} else {
					picSrc = node.getAttribute('data-src');
				}
				stack = [node];
				while (stack.length > 0) {		// Scan all descendants for IMG tag
					stkNode = stack.pop();
					if (stkNode.tagName === 'IMG') {
						picNode = stkNode;
						picMsrc = stkNode.getAttribute('src');
						break;
					}
					for (var i = stkNode.childNodes.length-1; i >= 0; i--) {
						if (stkNode.childNodes[i].nodeType === 1) stack.push(stkNode.childNodes[i]);
					}
				}
			}

			picItem = {
				ix: this.nextPid-1,		// save original array position in case of sort or shuffle
				src: picSrc,
				w: parseInt(picSizes[0], 10),
				h: parseInt(picSizes[1], 10),
				title: picCapt,
				pid: picPid,
				el: picNode					// save link to element for getThumbBoundsFn
			};
			if (picMsrc != '') picItem.msrc = picMsrc;

			this.items.push(picItem);
			this.nextPid++;
		}
	}

	node = node.firstChild;
	while (node) {
		this._getFromDOM(node);
		node = node.nextSibling;
	}
}

gallery.prototype._clearFromDOM = function (node) {
	if (node.nodeType === 1) node.removeAttribute('data-indx');
	node = node.firstChild;
	while (node) {
		this._clearFromDOM(node);
		node = node.nextSibling;
	}
}

// -----------------------------------------------------------------------
// Open a gallery (perhaps from a button) without clicking on thumbnails
// -----------------------------------------------------------------------

gallery.prototype.show = function (indx=0) {
	var	ln = this.items.length,
			pswpGallery;

	if (indx >= ln) return;
	// search for correct index in case of sort or shuffle
	for (var i=0; i<ln; i++) {
		if (this.items[i].ix == indx) {
			this.options.index = i;
			break;
		}
	}

	// open PhotoSwipe
	pswpGallery = new PhotoSwipe(this.pswpElement, PhotoSwipeUI_Default, this.items, this.options);
	pswpGallery.init();
}

// -----------------------------------------------------------------------
// Options to sort or shuffle the images in the gallery
// -----------------------------------------------------------------------

gallery.prototype.sortItemsByCapt = function () {
	var i,j,n;
	var ln=this.items.length-1;
	for (i=0; i<ln; i++) {
		n=i;
		for (j=i+1; j<=ln; j++) {
			if (this.items[j].title+_zeroPad(this.items[j].ix) < this.items[n].title+_zeroPad(this.items[n].ix)) n=j;
		}
		if (n != i) this._swapItems(i,n);
	}
}

gallery.prototype.sortItemsByPid = function () {
	var i,j,n;
	var ln=this.items.length-1;
	for (i=0; i<ln; i++) {
		n=i;
		for (j=i+1; j<=ln; j++) {
			if (this.items[j].pid+_zeroPad(this.items[j].ix) < this.items[n].pid+_zeroPad(this.items[n].ix)) n=j;
		}
		if (n != i) this._swapItems(i,n);
	}
}

gallery.prototype.shuffleItems = function () {
	var i,n;
	var ln=this.items.length-1;
	for (i=0; i<ln; i++) {
		n = _getRandomInt(ln-i+1)+i;
		if (n != i) this._swapItems(i,n);
	}
}

gallery.prototype._swapItems = function (a,b) {
	var temp;
	temp = this.items[a];
	this.items[a] = this.items[b];
	this.items[b] = temp;
}

function _zeroPad (val) {
	var str = '000' + val.toString();
	return str.slice(-3);
}

function _getRandomInt (max) {
  return Math.floor(Math.random() * Math.floor(max));		// Random integer 0..(max-1)
}

// =======================================================================
// Code that runs when a thumbnail is clicked
// =======================================================================

onThumbnailsClick = function (e) {
	// Because of the .bind() THIS is gallery object:			alert(this.galleryName);
	// NODE is set to IMG that was clicked (not the HREF):	alert(node.outerHTML);

	var	node = e.target || e.srcElement,
			dataIndx,
			indx,
			dataGid,
			pswpGallery;

	// search for data-indx in parents until top of gallery or body
	while (true) {
		dataIndx = node.getAttribute('data-indx');
		if (dataIndx !== null && dataIndx !== '') {
			indx = parseInt(dataIndx, 10);
			// search items for correct index in case of sort or shuffle
			for (var i=0, ln=this.items.length; i<ln; i++) {
				if (this.items[i].ix == indx) {
					this.options.index = i;
					break;
				}
			}
			break;
		}
		node = node.parentNode;
		if (node === document.body) break;
		dataGid = node.getAttribute('data-gid');
		if (dataGid !== null && dataGid !== '') break;
	}

	// Not an indexed image so quit
	if (dataIndx === null || dataIndx === '') return;

	// Found an index so prevent default action
	e = e || window.event;
	e.preventDefault ? e.preventDefault() : e.returnValue = false;

	// open PhotoSwipe since valid index was found
	pswpGallery = new PhotoSwipe(this.pswpElement, PhotoSwipeUI_Default, this.items, this.options);
	pswpGallery.init();

	return false;
}

// =======================================================================
// After creating galleries and getting items check if URL opens gallery
// =======================================================================

checkIfUrlCall = function (galleries) {
	var hash = window.location.hash.substring(1);
	if (hash === '') return;

	var	params = hash.toLowerCase().split('&'),
			parts,
			Gid = 0,
			Pid = '',
			checkGals,
			useGal = -1,
			useIdx = -1,
			pswpGallery;

	for (var i=0, ln=params.length; i<ln; i++) {
		parts = params[i].split('=');
		if (parts.length != 2) continue;
		if (parts[0] === 'gid') Gid = parseInt(parts[1], 10);
		if (parts[0] === 'pid') Pid = parts[1];
	}
	if (Gid <= 0 || Gid >= nextGid || Pid === '') return;

	if (galleries instanceof Array) {
		checkGals = galleries;
	} else {
		checkGals = [galleries];
	}

	for (var i=0, ln=checkGals.length; i<ln; i++) {
		if (checkGals[i].gid === Gid) {
			useGal = i;
			break;
		}
	}
	if (useGal === -1) return;

	for (var i=0, ln=checkGals[useGal].items.length; i<ln; i++) {
		if (checkGals[useGal].items[i].pid.toLowerCase() === Pid) {
			useIdx = i;
			break;
		}
	}
	if (useIdx === -1) return;

	checkGals[useGal].options.index = useIdx;
	
	// open PhotoSwipe since valid index was found
	pswpGallery = new PhotoSwipe(checkGals[useGal].pswpElement, PhotoSwipeUI_Default, checkGals[useGal].items, checkGals[useGal].options);
	pswpGallery.init();
}