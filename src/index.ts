import dotenv from 'dotenv';
import { MatchSimulator } from './matchSimulator';

dotenv.config();

async function main() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  
  if (!apiKey) {
    console.error('❌ FOOTBALL_API_KEY bulunamadı!');
    console.log('Çözüm: .env dosyasında FOOTBALL_API_KEY=your_key ekleyin');
    return;
  }

  const matchSim = new MatchSimulator(apiKey);

  try {
    console.log('🏈 Futbol Maç Simülatörü\n');
    
    const result = await matchSim.quickMatch('Real Madrid', 'Barcelona', 2022);
    
    console.log('📊 MAÇ SONUCU:', result.score);
    console.log('\n⚽ OLAYLAR:');
    result.events.forEach(event => console.log(`  ${event}`));
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

if (require.main === module) {
  main();
}
