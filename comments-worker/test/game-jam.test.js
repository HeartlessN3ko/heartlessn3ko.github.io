import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {validateJamSignup} from '../src/index.js';
test('notification signup validates and normalizes input', () => {
  assert.deepEqual(validateJamSignup({email:'  Person@Example.com ',handle:'Dev',interest:'compete'}),{email:'person@example.com',handle:'Dev',interest:'compete'});
  for (const payload of [null,{email:'not-email'},{email:'a@b.com',interest:'sponsor'},{email:'a@b.com',website:'spam'},{email:'a@b.com',handle:'x'.repeat(81)}]) assert.throws(()=>validateJamSignup(payload));
});
test('notification records require admin authentication', async () => {
 const res = await worker.fetch(new Request('https://comments.example/admin/game-jam/signups'),{});
 assert.equal(res.status,401);
});
test('cross-origin signup cannot write to database', async () => {
 const res=await worker.fetch(new Request('https://comments.example/game-jam/signups',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'}),{});
 assert.equal(res.status,403);
});
test('successful notification signup waits for database persistence', async () => {
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({success:true,action:'game_jam_signup'}));
 try {
   for (const succeeds of [true,false]) {
    let writes=0;
    const DB={prepare(sql){return {bind(){return this},async first(){return {attempts:1}},async run(){writes++;return {success:succeeds}}}}};
    const res=await worker.fetch(new Request('https://comments.example/game-jam/signups',{method:'POST',headers:{Origin:'https://srxnexus.org','Content-Type':'application/json'},body:JSON.stringify({email:'test@example.com',turnstileToken:'test'})}),{DB,RATE_LIMIT_SALT:'test',TURNSTILE_SECRET:'test'});
    assert.equal(writes,1);assert.equal(res.status,succeeds?200:503);
    assert.equal((await res.json()).subscribed,succeeds?true:undefined);
   }
 } finally {globalThis.fetch=oldFetch}
});
