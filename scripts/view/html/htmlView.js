import { View } from '../view.js';

function createMark(x, y, w, h) {
	const mark = document.createElement('div');
	mark.classList.add('mark');
	mark.style.width = w + 'px';
	mark.style.height = h + 'px';
	mark.style.left = (x) + 'px';
	mark.style.top = (y) + 'px';
	return mark;
}

function addSuccessMark(root, x, y, w, h) {
	const mark = createMark(x, y, w, h);
	mark.classList.add('mark--success');
	root.appendChild(mark);
	return mark;
}

function addFailMark(root, x, y) {
	const mark = createMark(x-50, y-50, 100, 100);
	mark.classList.add('mark--fail');
	root.appendChild(mark);
	return mark;
}

function buildHTML(container) {
	const h1 = document.createElement('h1');
	const imgA = document.createElement('img');
	const imgB = document.createElement('img');
	const contentContainer = document.createElement('div');
	const imagesContainer = document.createElement('div');
	const containerA = document.createElement('div');
	const containerB = document.createElement('div');
	const scoreContainer = document.createElement('div');
	const scoreSuccessDiv = document.createElement('div');
	const scoreFailDiv = document.createElement('div');
	const scoreSuccess = document.createElement('span');
	const scoreFail = document.createElement('span');
	const message = document.createElement('div');

	h1.classList.add('title');
	imgA.classList.add('layerImage');
	imgB.classList.add('layerImage');
	contentContainer.classList.add('content-container');
	imagesContainer.classList.add('images-container');
	containerA.classList.add('container');
	containerB.classList.add('container');
	scoreContainer.classList.add('score-container');
	scoreSuccess.classList.add('score-success');
	scoreFail.classList.add('score-fail');
	message.classList.add('message');

	containerA.appendChild(imgA);
	containerB.appendChild(imgB);
	contentContainer.appendChild(h1);
	imagesContainer.appendChild(containerA);
	imagesContainer.appendChild(containerB);
	contentContainer.appendChild(imagesContainer);

	scoreSuccessDiv.innerHTML = '<span>Отличий найдено: </span>';
	scoreFailDiv.innerHTML = '<span>Ошибок: </span>';

	scoreSuccessDiv.appendChild(scoreSuccess);
	scoreFailDiv.appendChild(scoreFail);
	scoreContainer.appendChild(scoreSuccessDiv);
	scoreContainer.appendChild(scoreFailDiv);
	contentContainer.appendChild(scoreContainer);
	contentContainer.appendChild(message);
	container.appendChild(contentContainer);

	message.innerHTML = '';
	message.style.display = 'none';

	return {
		h1, imagesContainer, imgA, imgB, containerA, containerB, contentContainer, scoreSuccess, scoreFail, message
	}

}

function buildSlots(slots, elementA, elementB) {
	const slotElements = [];
	for (let i = 1; i < slots.length; i++) {
		const img = document.createElement('img');
		img.classList.add('slot');
		const slot = slots[i];
		img.src = slot.imageUrl;
		img.style.left = slot.x + 'px';
		img.style.top = slot.y + 'px';
		if (slot.layer === 'LayerA') {
			elementA.appendChild(img);
			slotElements.push(img);
		} else if (slot.layer === 'LayerB') {
			elementB.appendChild(img);
			slotElements.push(img);
		}
	}
	return slotElements;
}

function adjustContentContainerScaleF(contentContainer, ) {
	return function (parent, element, ratio, orientation) {
		const scale = (orientation ? element.clientWidth : element.clientHeight) / 1155;
		contentContainer.style.scale = scale;
		contentContainer.style.width = (100 / scale) + '%';
		contentContainer.style.height = (100 / scale) + '%';
	}
}
function updateLevelF(onResize, elements, tap) {

	let marks = [];
	function clearMarks() {
		marks.forEach(m => m.remove());
		marks = [];
	}

	let slotElements = [];

	elements.imgA.addEventListener('click', event => {
		tap(event.offsetX, event.offsetY);
	});

	elements.imgB.addEventListener('click', event => {
		tap(event.offsetX, event.offsetY);
	});

	return function (level, slots) {

		elements.message.style.display = 'none';

		clearMarks();

		elements.h1.innerHTML = 'Уровень: ' + level;

		elements.imgA.src = slots[0].imageUrl;
		elements.imgB.src = slots[0].imageUrl;

		slotElements.forEach(el =>el.remove());
		slotElements = buildSlots(slots, elements.containerA, elements.containerB);

		elements.containerA.style.width = slots[0].width + 'px';
		elements.containerA.style.height = slots[0].height + 'px';

		elements.containerB.style.width = slots[0].width + 'px';
		elements.containerB.style.height = slots[0].height + 'px';

		elements.imagesContainer.style.width = ((slots[0].width < slots[0].height ? 2*slots[0].width : slots[0].width) + 16) + 'px';
		elements.imagesContainer.classList.remove('images-container--v');
		if (slots[0].width < slots[0].height) elements.imagesContainer.classList.add('images-container--v');

		onResize(adjustContentContainerScaleF(elements.contentContainer));

		const startCompleteAnimation = goToNextLevel => {
			elements.message.style.display = 'block';
			elements.message.innerHTML = 'Уровень пройден!';
			setTimeout(() => {
				elements.message.innerHTML = 'загрузка...';
				goToNextLevel();
			}, 3e3);
		};
		const drawScore = score => {
			elements.scoreSuccess.innerHTML = score[0] + '/' + score[2];
			elements.scoreFail.innerHTML = score[1];
		}

		const drawSuccessBox = (x,y,w,h) => {
			marks.push(addSuccessMark(elements.containerA, x,y,w,h));
			marks.push(addSuccessMark(elements.containerB, x,y,w,h));
		};

		const drawFailBox = (x, y) => {
			marks.push(addFailMark(elements.containerA, x, y));
			marks.push(addFailMark(elements.containerB, x, y));
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
	const elements = buildHTML(rootElement);
	const updateLevel = updateLevelF(onResize, elements, tap);

	return updateLevel;
}

export default function() {
	return View('div', buildStartLevel);
}