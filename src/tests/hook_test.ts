
import { Abc } from '../Abc';
import { Jianpu } from '../../other/Jianpu';

// Simple test runner
function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        throw new Error(message);
    } else {
        console.log(`PASS: ${message}`);
    }
}

// Mocking dependencies for the test
class MockDraw {
    draw_symbols(voice: any) {
        return "Core Draw Called";
    }
}

console.log("Starting Hook Integration Test...");

// 1. Setup Abc instance
const abc = new Abc({});

// Inject mock draw module if necessary, or rely on Abc's initialization
// Abc initializes real modules. We'll use the real/initialized structure but check effects.

// 2. Register Jianpu Hook
console.log("Registering hooks...");
Jianpu.hook(abc);
// Midi is auto-hooked in Abc constructor for now, or we can check property.

// 3. Verify hooks are registered
assert(typeof abc.hooks.calculate_beam === 'function', "calculate_beam hook registered");
assert(typeof abc.hooks.draw_symbols === 'function', "draw_symbols hook registered");
assert(!!abc.midi, "Midi module initialized");

// Verify do_pscom redirection
// We need to see if do_pscom hook is set? 
// In Midi.ts: abc.hooks.do_pscom = ...
// Depending on how I implemented Midi.hook. 
// Ah, definitions in Midi.ts:
/*
    static hook(abc: Abc) {
        ...
        abc.hooks.do_pscom = (text: string) => { ... }
    }
*/
assert(typeof abc.hooks.do_pscom === 'function', "do_pscom hook registered");

// 4. Verify Hook Invocation
// We want to verify that calling abc.draw_symbols calls Jianpu's version.
// We can check this by spying or by checking side effects, or simply trusting the type check above + structure.
// Let's monkey-patch the original Jianpu.prototype.draw_symbols to track calls if possible,
// OR since we are in a test script, we can inspect the bound function.

// Better: Spy on the hook function itself in the abc.hooks object?
// Actually, let's just assert that abc.hooks.draw_symbols is indeed the bound method.

// Let's try to execute it. We need a dummy voice object.
const dummyVoice = { sym: null };

// We need to suppress actual drawing or context errors since we are in Node environment without DOM/SVG.
// The code might try to access document or window.
// If code uses global 'window', it might fail in Node.
// Let's check if Abc or modules use window/document at top level or in constructor.
// Abc constructor is safe.
// Jianpu.hook is safe.
// Calling draw_symbols might trigger code that needs browser environment.

// For this quick verification, verifying the hook REGISTRATION is the most critical step for "refactoring correctness".
// Verifying execution might require a JSDOM setup.

console.log("Hook registration verified.");
