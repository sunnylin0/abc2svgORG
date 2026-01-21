// abc2svg - ModuleHandler
import { Abc } from '../Abc';

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

    static load(file: string, relay: Function, errmsg: Function) {
        // Simplified loader for refactored environment
        // Assuming static linking or ignoring dynamic load for now in this refactor step,
        // or just implementing the scan logic.

        let m, i, fn,
            ls = file.match(/(%%|I:).+?\b/g);

        if (!ls) {
            if (relay) relay();
            return true;
        }

        let loaded_something = false;

        for (i = 0; i < ls.length; i++) {
            fn = ls[i].replace(/\n?(%%|I:)/, '');
            m = this.modules[fn];
            if (!m || m.loaded)
                continue;

            m.loaded = true;
            loaded_something = true;

            // In a bundler environment, 'loading' might mean enabling features 
            // or dynamically importing.
            // For this refactor, we just log or callback.
            // If we want to support dynamic dispatch, we'd use import().

            // console.log(`Module ${fn} requested`);
        }

        if (relay) relay();
        return true;
    }
}
