import { View } from '../view.js';

function collectListeners(registrator, listeners) {
	registrator((...args) => listeners.forEach(l => l(...args)));
}
function resizeAppF(app) {
	return function (parent, element, ratio, orientation) {
		app.renderer.resize(element.clientWidth, element.clientHeight);
	}
}

function setSpritePositionRelateImage(image, sprite, x,y) {
	sprite.x = x - (image.width * image.anchor.x);
	sprite.y = y - (image.height * image.anchor.y);
}

function createResizableContainer(cx, cy, lcx, lcy) {
	const container = new PIXI.Container();
	const resize = (parent, element, ratio, orientation) => {
		container.x = (orientation ? cx : lcx) * element.clientWidth;
		container.y = (orientation ? cy : lcy) * element.clientHeight;
		const scale = (orientation ? element.clientWidth : element.clientHeight) / 1200;
		container.scale.set(scale);
	};
	return {
		container,
		resize
	};
}

function createMarkF(app, color) {

	return function (root, x, y, w, h) {
		const markGr = new PIXI.Graphics();
		markGr.lineStyle(16, color, 1);
		markGr.drawRoundedRect(0, 0, w, h, 16);
		const mark = new PIXI.Sprite(app.renderer.generateTexture(markGr));

		root.addChild(mark);
		setSpritePositionRelateImage(root, mark, x, y);

		return mark;
	}

}

function buildLevel(app, onResize, tap) {

	const { container: titleContainer, resize: titleResize } = createResizableContainer(.5, .1, .1, .1);
	const { container: imagesContainer, resize: imagesContainerResize } = createResizableContainer(.5, .5, .5, .5);
	const { container: scoreContainer, resize: scoreContainerResize } = createResizableContainer(.9, .8, .95, .1);
	const { container: messageContainer, resize: messageContainerResize } = createResizableContainer(.5, .5, .5, .5);

	const title = new PIXI.Text('Уровень', {
		fontFamily: 'FilmotypeMajor',
		fontSize: 84,
		fill: 0x000000,
		align: 'center',
	});

	const imgA = new PIXI.Sprite();
	const imgB = new PIXI.Sprite();

	const scoreTxtOpts = {
		fontFamily: 'FilmotypeMajor',
		fontSize: 42,
		fill: 0x000000,
		align: 'center',
	};

	const scoreSuccessText = new PIXI.Text('Отличий найдено: ', scoreTxtOpts);
	const scoreFailText = new PIXI.Text('Ошибок: ', scoreTxtOpts);

	const scoreSuccess = new PIXI.Text('0/0', { ...scoreTxtOpts, fill: 0x00ff00 });
	const scoreFail = new PIXI.Text('0', { ...scoreTxtOpts, fill: 0xff0000 });

	scoreFail.y = 1.5*scoreTxtOpts.fontSize;

	collectListeners(onResize, [
		resizeAppF(app),
		titleResize,
		imagesContainerResize,
		scoreContainerResize,
		messageContainerResize
	]);

	[title].forEach(sp => sp.anchor.set(.5, 0));
	imgA.anchor.set(1, .5);
	imgB.anchor.set(0, .5);

	imgA.interactive = imgB.interactive = true;

	const onTap = event => {
		const scale = event.target.parent.scale.x;
		const left = event.target.parent.x - scale * event.target.width * event.target.anchor.x;
		const top = event.target.parent.y - scale * event.target.height * event.target.anchor.y;
		const x = (event.screen.x - left) / scale;
		const y = (event.screen.y - top) / scale;
		tap(x, y);
	}

	imgA.on('pointertap', onTap);
	imgB.on('pointertap', onTap);

	[scoreSuccessText, scoreFailText].forEach(sp => sp.anchor.set(1, 0));
	[scoreSuccess, scoreFail].forEach(sp => sp.anchor.set(0, 0));

	scoreSuccess.addChild(scoreSuccessText);
	scoreFail.addChild(scoreFailText);

	titleContainer.addChild(title);
	imagesContainer.addChild(imgA, imgB);
	scoreContainer.addChild(scoreSuccess, scoreFail);

	const message = new PIXI.Text('', {
		fontFamily: 'FilmotypeMajor',
		fontSize: 128,
		fill: 0x007700,
		align: 'center',
	});

	message.anchor.set(.5);

	const messgeGr = new PIXI.Graphics();

	messgeGr.lineStyle(24, 0x007700, 1);
	messgeGr.beginFill(0xffffff);
	messgeGr.drawRoundedRect(0, 0, 1024, 256, 32);

	const messagePanel = new PIXI.Sprite(app.renderer.generateTexture(messgeGr));
	messagePanel.anchor.set(.5);
	messageContainer.addChild(messagePanel, message);

	app.stage.addChild(titleContainer, imagesContainer, scoreContainer, messageContainer);

	return {
		title, scoreSuccess, scoreFail, imgA, imgB, message
	};
}

function buildSlots(slots, elementA, elementB) {
	const slotElements = [];
	for (let i = 1; i < slots.length; i++) {
		//getLeftTopOfSprite
		const slot = slots[i];
		const img = PIXI.Sprite.from(slot.imageUrl);
		img.width = slot.width;
		img.height = slot.height;
		img.anchor.set(0);

		if (slot.layer === 'LayerA') {
			elementA.addChild(img);
			setSpritePositionRelateImage(elementA, img, slot.x, slot.y);
			slotElements.push(img);
		} else if (slot.layer === 'LayerB') {
			elementB.addChild(img);
			setSpritePositionRelateImage(elementB, img, slot.x, slot.y);
			slotElements.push(img);
		}
	}
	return slotElements;
}

function updateLevelF(app, elements) {
	let marks = [];
	function clearMarks() {
		marks.forEach(m => m.parent.removeChild(m));
		marks = [];
	}

	let slotElements = [];

	const addSuccessMark = createMarkF(app, 0x00ff00);
	const addFailMark = (root, x,y) => {
		const mark = createMarkF(app, 0xff0000)(root, x, y, 100, 100);
		mark.anchor.set(.5);
		const X = new PIXI.Text('X', {
			fontFamily: 'FilmotypeMajor',
			fontSize: 84,
			fill: 0xff0000,
			align: 'center',
		});
		X.anchor.set(.5);
		mark.addChild(X);
		return mark;
	};

	return function (level, slots) {

		elements.message.parent.visible = false;

		const orientation = slots[0].width < slots[0].height;

		clearMarks();

		elements.title.text = 'Уровень: ' + level;

		elements.imgA.texture = PIXI.Texture.from(slots[0].imageUrl);
		elements.imgB.texture = PIXI.Texture.from(slots[0].imageUrl);

		elements.imgA.width = slots[0].width;
		elements.imgA.height = slots[0].height;

		elements.imgB.width = slots[0].width;
		elements.imgB.height = slots[0].height;

		if (orientation) {
			elements.imgA.anchor.set(1.025, .5);
			elements.imgB.anchor.set(-.025, .5);
		} else {
			elements.imgA.anchor.set(.5, 1.025);
			elements.imgB.anchor.set(.5, -.025);
		}

		slotElements.forEach(el => el.parent.removeChild(el));
		slotElements = buildSlots(slots, elements.imgA, elements.imgB);

		const startCompleteAnimation = goToNextLevel => {
			elements.message.parent.visible = true;
			elements.message.text = 'Уровень пройден!';
			setTimeout(() => {
				elements.message.text = 'загрузка...';
				goToNextLevel();
			}, 3e3);
		};
		const drawScore = score => {
			elements.scoreSuccess.text = score[0] + '/' + score[2];
			elements.scoreFail.text = score[1];
		}

		const drawSuccessBox = (x, y, w, h) => {
			marks.push(addSuccessMark(elements.imgA, x, y, w, h));
			marks.push(addSuccessMark(elements.imgB, x, y, w, h));
		};

		const drawFailBox = (x, y) => {
			marks.push(addFailMark(elements.imgA, x, y));
			marks.push(addFailMark(elements.imgB, x, y));
		};

		const drawError = error => {
			console.error(error);
			alert('error! error code: ' + error);
		}

		//return level handle
		return {
			startCompleteAnimation,
			drawScore,
			drawSuccessBox,
			drawFailBox,
			drawError
		}
	}
}

function buildStartLevel(rootElement, onResize, tap) {

	const app = new PIXI.Application({
		view: rootElement,
		width: rootElement.clientWidth,
		height: rootElement.clientHeight,
		background: 0xffffff,
		resolution: devicePixelRatio
	});

	const elements = buildLevel(app, onResize, tap);
	const updateLevel = updateLevelF(app, elements);

	return updateLevel;
}

export default function () {
	return View('canvas', buildStartLevel);
}