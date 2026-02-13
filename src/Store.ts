import { Abc } from './Abc';
import { Music } from './modules/Music';
import { Parse } from './modules/Parser';
import { Deco } from './modules/Deco';
import { Draw } from './modules/Draw';
import { Svg } from './modules/Svg';
import { Subs } from './modules/Subs';
import { Tune } from './modules/Tune';
import { Format } from './modules/Format';
import { Front } from './modules/Front';
import { Lyrics } from './modules/Lyrics';
import { Gchord } from './modules/Gchord';

let abc: Abc = new Abc("User");
let Amusic: Music = abc.music;
let Aparser: Parse = abc.parser;
let Adeco: Deco = abc.deco;
let Adraw: Draw = abc.draw;
let Asvg: Svg = abc.svg;
let Asubs: Subs = abc.subs;
let Atune: Tune = abc.tune;
let Aformat: Format = abc.format;
let Afront: Front = abc.front;
let Alyrics: Lyrics = abc.lyrics;
let Agchord: Gchord = abc.gchord;


export {
	abc, Amusic, Aparser, Adeco, Adraw, Asvg, Asubs,
	Atune, Aformat, Afront, Alyrics, Agchord
}
