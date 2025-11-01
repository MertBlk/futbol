import dotenv from 'dotenv';
import { MatchSimulator } from './matchSimulator';

dotenv.config();

async function main() {
  // API çağrıları devre dışı - demo mode kullan
  const apiKey = 'demo'; // process.env.FOOTBALL_API_KEY || 'demo';
  
  console.log('⚠️  API çağrıları devre dışı - DEMO MODE aktif');

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
