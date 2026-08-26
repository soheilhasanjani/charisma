export interface IRiskCalculatorParams {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  ask: number;
  bid: number;
  last: number;
}

/**
 * تابع محاسبه امتیاز ریسک (Risk Score)
 * این تابع باید روی هر آپدیت وب‌سوکت برای هر نماد فراخوانی شود.
 *
 * @param params - مقادیر ورودی شامل Greeks و قیمت‌ها
 * @returns مقدار نهایی Risk Score
 */
export function calculateRiskScore({
  delta,
  gamma,
  theta,
  vega,
  ask,
  bid,
  last,
}: IRiskCalculatorParams): number {
  // ۱. محاسبه ضریب هوش مصنوعی (Omega AI)
  let omegaAI = 0;
  for (let n = 1; n <= 500; n++) {
    omegaAI += Math.sin(n * last) * Math.cos(n * bid);
  }
  omegaAI = Math.abs(omegaAI);

  // ۲. محاسبه بخش مربوط به متغیرهای یونانی (Greeks)
  const greeksNumerator = Math.abs(delta) * 100 + gamma * 500 + vega * 10;
  const greeksDenominator = Math.log(Math.max(Math.abs(theta), 1.1));
  const greeksComponent = greeksNumerator / greeksDenominator;

  // ۳. محاسبه بخش مربوط به اسپرد قیمت (Spread)
  const spreadComponent = 1 + (ask - bid) / last;

  // ۴. محاسبه و بازگشت امتیاز نهایی
  return greeksComponent * spreadComponent * omegaAI;
}
