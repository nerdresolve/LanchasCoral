import { chromium } from '@playwright/test'
const B='https://coral.nerdresolve.com'
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage()
await p.goto(`${B}/comparar?a=coral-26-blackline&b=coral-29-cabinada`,{waitUntil:'networkidle'})
await p.waitForTimeout(1000)
await p.locator('button:has-text("Trocar")').first().click()
await p.waitForTimeout(700)
const d = await p.evaluate(()=>{
  const cx=document.querySelector('[role="listbox"]').closest('div[style]')
  const r=cx.getBoundingClientRect()
  return { saiDaTela: r.bottom > innerHeight+1, altura: Math.round(r.height), temBusca: !!cx.querySelector('input') }
})
console.log('  posicionamento:', JSON.stringify(d))
// busca funciona?
await p.locator('[role="listbox"]').locator('..').locator('input').fill('50')
await p.waitForTimeout(500)
console.log('  buscando "50":', await p.locator('[role="option"]').count(), 'resultado(s)')
await p.locator('input').last().fill('cabin')
await p.waitForTimeout(500)
console.log('  buscando "cabin":', await p.locator('[role="option"]').count(), 'resultado(s)')
// teclado
await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter')
await p.waitForTimeout(2200)
console.log('  escolheu pelo teclado:', (await p.locator('h2').first().innerText()).trim())
await b.close()
