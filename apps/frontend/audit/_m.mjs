import { chromium } from '@playwright/test'
const B='https://coral.nerdresolve.com'
const b=await chromium.launch()
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage()
await p.goto(`${B}/comparar?a=coral-26-blackline&b=coral-29-cabinada`,{waitUntil:'networkidle'})
await p.waitForTimeout(1200)
// o botao de trocar do lado direito e o caso dificil: perto da borda
await p.locator('button:has-text("Trocar")').last().click()
await p.waitForTimeout(700)
const d = await p.evaluate(()=>{
  const cx=document.querySelector('[role="listbox"]').closest('div[style]')
  const r=cx.getBoundingClientRect()
  return { cabeNaLargura: r.left>=-1 && r.right<=innerWidth+1, cabeNaAltura: r.bottom<=innerHeight+1, largura:Math.round(r.width) }
})
console.log('  lista no celular:', JSON.stringify(d))
await p.screenshot({path:process.argv[2]+'/mob-drop.png'})
await b.close()
