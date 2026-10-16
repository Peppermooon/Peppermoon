// Standard gpt-6-luna rates checked 2026-10-16. Estimate only, not an invoice.
export function estimateNewsCost(usage){
 if(!usage||!Number.isSafeInteger(usage.input_tokens)||!Number.isSafeInteger(usage.output_tokens)||usage.input_tokens<0||usage.output_tokens<0)return null;
 const cached=usage.input_tokens_details?.cached_tokens??0;
 if(!Number.isSafeInteger(cached)||cached<0||cached>usage.input_tokens)return null;
 return {currency:'USD',estimated:true,usd:((usage.input_tokens-cached)*0.10+cached*0.01+usage.output_tokens*0.50)/1000000,
  input_tokens:usage.input_tokens,cached_input_tokens:cached,output_tokens:usage.output_tokens,
  model:'gpt-6-luna',rates_checked:'2026-10-16'};
}
