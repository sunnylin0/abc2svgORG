// abc2svg - ModuleHandler
import { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';
export class ModuleHandler {
	static modules: { [key: string]: any } = {
		ambitus: {},
		begingrid: { fn: 'grid3' },
		beginps: { fn: 'psvg' },
		break: {},
		capo: {},
		chordnames: {},
		clip: {},
		clairnote: { fn: 'clair' },
		voicecombine: { fn: 'combine' },
		diagram: { fn: 'diag' },
		equalbars: {},
		fit2box: {},
		gamelan: {},
		grid: {},
		grid2: {},
		jazzchord: {},
		jianpu: {},
		mdnn: {},
		MIDI: {},
		nns: {},
		pageheight: { fn: 'page' },
		pedline: {},
		percmap: { fn: 'perc' },
		playswing: { fn: 'swing' },
		roman: {},
		soloffs: {},
		sth: {},
		strtab: {},
		temperament: { fn: 'temper' },
		temponame: { fn: 'tempo' },
		tropt: {},
		titleformat: { fn: 'tunhd' }
	};

	static nreq = 0;
	// scan the file and find the required modules
	// @file: ABC file
	// @relay: (optional) callback function for continuing the treatment
	// @errmsg: (optional) function to display an error message if any
	//	This function gets one argument: the message
	// return true when all modules are loaded
	static load(file: string, relay: Function, errmsg: Function) {
		function get_errmsg() {
			if (typeof user == 'object' && user.errmsg)
				return user.errmsg
			if (typeof abc2svg.printErr == 'function')
				return abc2svg.printErr
			if (typeof alert == 'function')
				return function (m) { alert(m) }
			if (typeof console == 'object')
				return console.log
			return function () { }
		} // get_errmsg()

		// call back functions for loadjs()
		function load_end() {
			if (--abc2svg.modules.nreq == 0)
				abc2svg.modules.cbf()
		}

		// test if some keyword in the file
		let m, i, fn,
			ls = file.match(/(%%|I:).+?\b/g);

		if (!ls)
			return true

		this.cbf = relay ||		// (only one callback function)
			function () { }
		this.errmsg = errmsg || get_errmsg()

		let loaded_something = false;
		for (i = 0; i < ls.length; i++) {
			fn = ls[i].replace(/\n?(%%|I:)/, '')
			m = abc2svg.modules[fn]
			if (!m || m.loaded)
				continue

			m.loaded = true

			// load the module
			if (m.fn)
				fn = m.fn
			this.nreq++
			abc2svg.loadjs(fn + "-1.js",
				load_end,
				function () {
					abc2svg.modules.errmsg(
						'Error loading the module ' + fn)
					load_end()
				})
		}
		return this.nreq == nreq_i
	}
}
