import { MatchSimulator } from './matchSimulator';

async function main() {
  // API key'i environment variable'dan al
  const apiKey = process.env.FOOTBALL_API_KEY || 'YOUR_API_KEY_HERE';
  
  if (apiKey === 'YOUR_API_KEY_HERE') {
    console.error('❌ Lütfen FOOTBALL_API_KEY environment variable\'ını ayarlayın');
    console.log('Örnek: export FOOTBALL_API_KEY="your_api_key_here"');
    return;
  }

  const matchSim = new MatchSimulator(apiKey);

  try {
    console.log(' Futbol Maç Simülatörü');
    console.log('========================\n');

    // Örnek 1: Hızlı maç
    console.log('Real Madrid vs Barcelona maçı simüle ediliyor...\n');
    const result = await matchSim.quickMatch('Real Madrid', 'Barcelona', 2024);
    
    console.log('📊 MAÇ SONUCU:');
    console.log('===============');
    console.log(`📈 ${result.score}`);
    console.log('\n⚽ OLAYLAR:');
    result.events.forEach(event => console.log(`  ${event}`));
    
    console.log('\n📈 İSTATİSTİKLER:');
    Object.entries(result.teamStats).forEach(([team, stats]) => {
      console.log(`\n${team}:`);
      console.log(`  🎯 Şut: ${stats.shots}`);
      console.log(`  🏃 Top Hakimiyeti: %${stats.possession}`);
      console.log(`  ⚽ Pas: ${stats.passes}`);
      console.log(`  🚩 Korner: ${stats.corners}`);
    });

  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

// Örnek kullanım fonksiyonları
export async function simulateCustomMatch(
  team1Name: string, 
  team2Name: string, 
  season: number = 2024,
  apiKey: string
) {
  const matchSim = new MatchSimulator(apiKey);
  return await matchSim.quickMatch(team1Name, team2Name, season);
}

export async function searchTeams(teamName: string, apiKey: string) {
  const matchSim = new MatchSimulator(apiKey);
  return await matchSim.searchAndSelectTeam(teamName);
}

// Ana fonksiyonu çalıştır
if (require.main === module) {
  main();
}
