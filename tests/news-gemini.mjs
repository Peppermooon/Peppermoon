import assert from 'node:assert/strict';
import {generateGeminiDraft} from '../lib/news-gemini.mjs';
process.env.GEMINI_API_KEY='test-secret';
const draft={title:'A headline',summary:'A summary',paragraphs:['Verified facts.'],review_notes:[]};
let calls=0;
function mock(body,status=200){globalThis.fetch=async url=>{calls++;assert.match(url,/generativelanguage\.googleapis\.com/);return new Response(JSON.stringify(body),{status})};}
for(const status of [400,401,403,404,429,500]){
 mock({error:{message:'test-secret'}},status);const before=calls;
 await assert.rejects(generateGeminiDraft({}),e=>e.status===(status===429?429:status===500?502:503)&&!e.message.includes('test-secret'));
 assert.equal(calls,before+1);
}
for(const body of [null,{}, {promptFeedback:{blockReason:'SAFETY'}}, {candidates:[{finishReason:'MAX_TOKENS'}]}, {candidates:[{finishReason:'STOP',content:{parts:[{text:'bad json'}]}}]}, {candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...draft,paragraphs:[]})}]}}]}]){
 mock(body);await assert.rejects(generateGeminiDraft({}),e=>e.status===502);
}
globalThis.fetch=async()=>{calls++;throw new Error('test-secret')};
const before=calls;await assert.rejects(generateGeminiDraft({}),e=>e.status===502&&!e.message.includes('test-secret'));assert.equal(calls,before+1);
mock({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'Private reasoning'},{text:JSON.stringify(draft)}]}}],usageMetadata:{promptTokenCount:100,candidatesTokenCount:80,thoughtsTokenCount:20,totalTokenCount:200}});
const result=await generateGeminiDraft({});assert.deepEqual(result.draft,draft);assert.equal(result.usage.thinking_tokens,20);assert.equal(result.usage.total_tokens,200);
console.log('Passed Gemini failure cases, single-request behavior, invalid draft rejection, thought filtering and token accounting.');
