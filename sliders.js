this.Sliders = (function () {

	function PublisherFactory() {
		this.create = () => {
			let publisherInstance = {
				subscribers: new Set(),
				subscribe(callback) {
					publisherInstance.subscribers.add(callback);
					return {
						index: parseInt(publisherInstance.subscribers.size - 1),
						entity: callback
					}
				},
				unsubscribe(callback) {

					if (Number.isInteger(callback)) {
						let i = 0;

						for (let sub of publisherInstance.subscribers) {
							if (i === publisherInstance.subscribers.size - 1) return publisherInstance.subscribers.delete(sub);
							i++;
						}

						return false;
					}

					let keys = Object.keys(callback);
					if (keys.includes("index") && keys.includes("entity")) return publisherInstance.subscribers.delete(callback.entity);

					return publisherInstance.subscribers.delete(callback);

				},
				publish(...data) {
					return publisherInstance.subscribers.forEach(callback => callback(data));
				}
			}
			return publisherInstance;
		}
	}

	const Publisher = new PublisherFactory().create;

	const LOOP = {
		publisher: Publisher()
	}

	let lastFrame = performance.now();
	let temp;

	LOOP.publisher.subscribe(() => {
		temp = performance.now();
		LOOP.frameTime = temp - lastFrame;
		lastFrame = temp;
		requestAnimationFrame(LOOP.publisher.publish);
	});
	
	LOOP.publisher.publish();

	function SliderProcess({
		target,
		autoplay,
		slides,
		current,
		paused,
		autoinit
	}) {

		//scoped api

		this.next = () => {
			if (!this.slides || !this.slides.length) return false;
			this.current++;
			if (this.current >= this.slides.length) this.current = 0;
			this.changePublisher.publish(this, { current: this.current });
			return this.current;
		}

		this.prev = () => {
			if (!this.slides || !this.slides.length) return false;

			this.current--;
			if (this.current < 0) this.current = this.slides.length - 1;
			this.changePublisher.publish(this, { current: this.current });
			return this.current;
		}

		this.goTo = (index = 0) => {
			if (!this.slides || !this.slides.length) return false;

			this.current = parseInt(index);
			if (this.current < 0) this.current = 0;
			if (this.current >= this.slides.length) this.current = this.slides.length == 0 ? null : this.slides.length - 1;
			this.changePublisher.publish(this, { current: this.current });
			return this.current;
		}

		this.play = () => {
			if (!this.slides || !this.slides.length) return false;

			this.paused = false;
			this.changePublisher.publish(this, { paused: this.paused });
			return this.paused;
		}

		this.pause = () => {
			if (!this.slides || !this.slides.length) return false;

			this.paused = true;
			this.changePublisher.publish(this, { paused: this.paused });
			return this.paused;
		}

		this.init = () => {
			if (target) this.target = document.querySelector(target);

			if (this.target) {

				if (slides && slides.length) {
					this.slides = slides;

				} else if (this.target.children.length) {
					this.slides = [...this.target.children];

				} else {
					this.slides = [];
				}

				if (Number.isInteger(current)) {
					this.goTo(current);

				} else {
					this.current = null;
				}

			} else if (slides && slides.length) {
				this.slides = slides;

				if (Number.isInteger(current)) {
					this.goTo(current);

				} else {
					this.current = null;
				}

			} else {
				this.slides = [];
				this.current = null;
			}

			this.paused = paused || false;

			if (autoplay) {
				//todo
				console.log("Test")
				LOOP.publisher.subscribe(() => {
					if (this.slides && this.slides.length) console.log(this, LOOP.frameTime)
				});
			}

			this.changePublisher.publish(this, { initialized: this.initialized });
			return true;
		}

		this.changePublisher = Publisher();

		//slider internals
		if (autoinit) this.init();
	}

	const SliderProcessManager = (function () {

		//scoped api
		function Manager() {
			this.list = new Set();

			const NULLEntry = {
				index: null,
				entity: null
			}

			this.create = function (data) {
				// if (!data || !data.target || !document.querySelector(data.target)) return NULLEntry;

				let ret = {
					index: parseInt(this.list.size - 1),
					entity: new SliderProcess(data)
				}

				this.list.add(ret.entity);

				return ret;
			}

			this.remove = (processTrace) => {
				if (Number.isInteger(processTrace)) {
					let index = 0;

					for (let entity of this.list) {
						if (index === processTrace) return this.list.delete(entity);

						index++;
					};

					index = undefined;

					return false;
				}

				if (SliderProcess.checkProcessOrigin(processTrace))
					return this.list.delete(processTrace);

				if (processTrace.constructor.hasOwnProperty("keys")) {
					processTrace.keys = Object.keys(processTrace);

					if (
						processTrace.keys.includes("index") &&
						processTrace.keys.includes("entity")

					) return this.list.delete(processTrace.entity);

					return false;
				}

				return false;
			}

			this.get = (processTrace) => {

				if (processTrace === undefined || processTrace === null) return NULLEntry;

				if (Number.isInteger(processTrace)) {
					let index = 0;

					for (let entity of this.list) {
						if (processTrace === index) return { index, entity };

						index++;
					};

					index = undefined;

					return NULLEntry;
				}

				if (processTrace.constructor.hasOwnProperty("keys")) {
					let keys = Object.keys(processTrace);

					if (
						keys.includes("index") &&
						keys.includes("entity")

					) return processTrace;

					keys = undefined;

					return;
				}

				if (SliderProcess.checkProcessOrigin(processTrace)) {
					let index = 0;
					
					for (let entity of this.list) {
						if (processTrace === entity) return { index, entity };

						index++;
					};

					index = undefined;

					return NULLEntry;
				}

				return NULLEntry;
			}

			this.getAll = () => this.list;

			this.changePublisher = Publisher();

			document.addEventListener("readystatechange", ({ target: { readyState } }) => this.changePublisher.publish(this, readyState));
		}

		//singleton internals
		let manager;

		return () => {
			if (!manager) manager = new Manager();
			SliderProcess.checkProcessOrigin = ({ constructor }) => constructor === SliderProcess;
			return manager;
		};

	})();

	return SliderProcessManager()
})();

if (Sliders.debug) {
	Sliders.changePublisher.subscribe(console.log);
}