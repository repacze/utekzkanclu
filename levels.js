const box = (x,z,w,d,h=2.4,label='',opts={}) => ({x,z,w,d,h,label,...opts});
const desk = (x,z,w=2.6,d=1.4,label='stůl') => box(x,z,w,d,1.05,label);
const wall = (x,z,w,d,label='stěna',opts={}) => box(x,z,w,d,2.8,label,opts);

function wallWithDoorX(x,zCenter,totalD,doorZ,id,doorD=2.2){
  const min=zCenter-totalD/2, max=zCenter+totalD/2;
  const doorMin=doorZ-doorD/2, doorMax=doorZ+doorD/2;
  if(doorMin<=min || doorMax>=max) throw new Error(`Door ${id} does not fit wall`);
  return [
    wall(x,(min+doorMin)/2,.35,doorMin-min),
    wall(x,doorZ,.35,doorD,'dveře',{id,door:true}),
    wall(x,(doorMax+max)/2,.35,max-doorMax)
  ];
}
const plant = (x,z) => box(x,z,1.1,1.1,1.8,'květina');
const cp = (x,z,r=1.5) => ({x,z,r});
const npc = (role,x,z,patrol,fov=72,range=8.5,speed=1.25,opts={}) => ({role,x,z,patrol,fov,range,speed,...opts});
const it = (type,x,z,label,opts={}) => ({type,x,z,label,...opts});

function perimeter(w,d){
  return [
    wall(0,-d/2,w,.35), wall(0,d/2,w,.35), wall(-w/2,0,.35,d), wall(w/2,0,.35,d)
  ];
}

export const LEVELS = [
  {
    id:1,
    name:'Tichý odchod',
    subtitle:'První pravidlo: šéf nesmí vidět, že už máš bundu.',
    objective:'Dostaň se od stolu k východu. Tady ještě stačí čistý stealth.',
    hint:'WASD pohyb · C stealth · Shift sprint · stoly skutečně kryjí výhled.',
    theme:{floor:0x626970,wall:0xd9dde1,accent:0xd9ff5b,fog:0xaab1b7,bg:0x929ba4},
    size:[30,22], start:[-11,7], exit:[11,-7], timePar:55,
    obstacles:[...perimeter(30,22),desk(-7,5),desk(-1,5),desk(5,5),desk(-7,0),desk(-1,0),desk(5,0),wall(4,-4,8,.45),plant(8,7)],
    npcs:[npc('boss',2,-7,[[2,-7],[8,-7],[8,-2],[2,-2]],84,10,1.15)],
    checkpoints:[cp(-2,1.8)], interactions:[it('workspot',-11,6.1,'Předstírat práci')]
  },
  {
    id:2,
    name:'Zasedačka je tvůj přítel',
    subtitle:'Tentokrát je zasedačka jediná cesta skrz patro.',
    objective:'Projdi zasedačkou. Dvoje dveře jsou skutečná fyzická překážka.',
    hint:'E otevře dveře. Bez otevření se přes příčku opravdu nedostaneš.',
    theme:{floor:0x59636d,wall:0xdde2e6,accent:0x9ee7ff,fog:0x9da6ae,bg:0x8d979f},
    size:[34,24], start:[-14,9], exit:[13,-8], timePar:70,
    obstacles:[...perimeter(34,24),desk(-12,7),desk(-7,7),desk(-12,2),desk(11,7),desk(11,2),
      wall(0,-6.65,.35,10.7),wall(0,6.65,.35,10.7),box(0,0,.35,2.6,2.8,'dveře',{id:'l2-entry',door:true}),
      wall(5,-6.65,.35,10.7),wall(5,6.65,.35,10.7),box(5,0,.35,2.6,2.8,'dveře',{id:'l2-exit',door:true}),
      wall(2.5,-1.5,5,.25,'skleněná příčka'),wall(2.5,1.5,5,.25,'skleněná příčka'),plant(-7,-7),plant(9,-7)],
    rooms:[{x:2.5,z:0,w:4.6,d:2.6,safe:true,label:'Zasedačka'}],
    npcs:[npc('coworker',9,-2,[[9,-2],[13,-2],[13,4],[9,4]],72,8,1.15),npc('boss',11,8,[[11,8],[7,8],[7,5],[11,5]],86,10,1.1)],
    checkpoints:[cp(2.5,0)], interactions:[it('door',-.7,0,'Otevřít dveře do zasedačky',{opens:'l2-entry'}),it('door',4.3,0,'Otevřít dveře ze zasedačky',{opens:'l2-exit'})]
  },
  {
    id:3,
    name:'Kafe zachraňuje životy',
    subtitle:'Kolega stojí přesně v jediném průchodu.',
    objective:'Odlákej kolegu od úzké chodby kávovarem nebo mikrovlnkou a proklouzni.',
    hint:'Bez diverze kolega fyzicky blokuje průchod. Jakmile jde řešit kafe, cesta je volná.',
    theme:{floor:0x72675f,wall:0xe3ddd8,accent:0xffc66b,fog:0xb5aaa1,bg:0xa3978d},
    size:[34,24], start:[-13,8], exit:[13,-8], timePar:78,
    obstacles:[...perimeter(34,24),desk(-11,7),desk(-6,7),desk(-11,2),desk(9,7),desk(10,-6),
      wall(2,-6.6,.35,10.8),wall(2,6.6,.35,10.8),box(-3,5,2.8,1.1,1.15,'kuchyňská linka'),box(-3,-5,2.8,1.1,1.15,'kuchyňská linka'),plant(-8,-6),plant(10,2)],
    npcs:[npc('coworker',2,0,[[2,0]],78,8.5,1.15,{id:'kitchenGate',hardBlock:true,gateRadius:1.35,gateHint:'Kolega stojí v jediném průchodu. Odlákej ho kávovarem nebo mikrovlnkou.'}),npc('coworker',9,-1,[[9,-1],[12,-1],[12,4],[9,4]],70,7.5,1.15)],
    checkpoints:[cp(4,0)],
    interactions:[it('coffee',-3,5,'Spustit hlučné čištění kávovaru',{targetIds:['kitchenGate'],duration:12}),it('microwave',-3,-5,'Nechat mikrovlnku hlasitě dopípat',{targetIds:['kitchenGate'],duration:10}),it('workspot',-10,6.1,'Předstírat práci')]
  },
  {
    id:4,
    name:'1000 kopií',
    subtitle:'Průchod hlídá kolega. Kopírka je zajímavější než ty.',
    objective:'Spusť 1000 kopií. Kolega opustí jediný průchod a půjde řešit papírovou katastrofu.',
    hint:'Kopírka není checklist: bez ní je průchod fyzicky obsazený.',
    theme:{floor:0x59616a,wall:0xd8dde2,accent:0xff7c70,fog:0x99a2aa,bg:0x89939b},
    size:[38,26], start:[-15,9], exit:[15,-9], timePar:92,
    obstacles:[...perimeter(38,26),desk(-13,8),desk(-7,8),desk(-1,8),desk(-13,3),desk(-7,3),desk(11,7),
      wall(4,-9.1,.35,7.8),wall(4,5.1,.35,15.8),box(-2,-7,1.20,.82,1.18,'kopírka'),plant(-12,-7),plant(13,2)],
    npcs:[npc('coworker',4,-4,[[4,-4]],78,9,1.2,{id:'copyGate',hardBlock:true,gateRadius:1.35,gateHint:'Kolega blokuje jediný průchod. Kopírka ho odtud vytáhne.'}),npc('it',-12,-9,[[-12,-9],[-8,-9],[-8,-5],[-12,-5]],70,7.5,1.3),npc('coworker',11,3,[[11,3],[15,3],[15,8],[11,8]],70,8,1.15)],
    checkpoints:[cp(6,-4)],
    interactions:[it('copier',-2,-7,'Poslat na kopírku 1000 kopií',{targetIds:['copyGate'],duration:14}),it('phone',-2,7,'Rozezvonit telefon',{radius:8,duration:7})]
  },
  {
    id:5,
    name:'Máš minutku?',
    subtitle:'Ukecaný kolega nepustí nikoho, kdo vypadá, že má čas.',
    objective:'Seber desky. S nimi projdeš kolem ukecaného kolegy jako člověk mířící na důležitý meeting.',
    hint:'Bez desek tě kolega zastaví v jediném průchodu. S deskami tě nechá projít.',
    theme:{floor:0x5d6862,wall:0xdfe4e0,accent:0x9ef0b2,fog:0xa2aca6,bg:0x929d97},
    size:[40,28], start:[-16,10], exit:[16,-10], timePar:105,
    obstacles:[...perimeter(40,28),desk(-14,9),desk(-8,9),desk(-14,4),desk(-8,4),desk(11,8),desk(11,3),desk(11,-3),
      wall(4,-7.65,.35,12.7),wall(4,7.65,.35,12.7),plant(-13,-6),plant(14,1)],
    npcs:[npc('chatter',4,0,[[4,0]],88,9,1.2,{id:'chatterGate',hardBlock:true,gateRadius:1.35,passItem:'folder',gateHint:'Bez desek tě ukecaný kolega zastaví. Vrať se pro ně.'}),npc('pm',12,-6,[[12,-6],[16,-6],[16,0],[12,0]],78,9,1.5),npc('boss',13,10,[[13,10],[8,10],[8,6],[13,6]],84,9.5,1.15)],
    checkpoints:[cp(6,0)],
    interactions:[it('pickup-folder',-11,8,'Sebrat desky'),it('workspot',-8,3.1,'Předstírat práci'),it('phone',11,2,'Rozezvonit telefon',{radius:8,duration:8})]
  },
  {
    id:6,
    name:'Recepce',
    subtitle:'Tady už nepomůže charisma. Turniket chce badge.',
    objective:'Najdi badge a fyzicky odemkni turniket v jediné cestě ven.',
    hint:'Turniket je součást bariéry přes celé patro. Bez badge se kolem něj obejít nedá.',
    theme:{floor:0x4d5662,wall:0xe0e4e8,accent:0x78c8ff,fog:0x969fa9,bg:0x858f99},
    size:[42,28], start:[-17,10], exit:[17,-10], timePar:115,
    obstacles:[...perimeter(42,28),desk(-15,9),desk(-9,9),desk(-3,9),box(12,-1,5,1.6,1.15,'recepce'),
      wall(-5.5,-6,31,.35),wall(16.5,-6,9,.35),box(11,-6,2,.8,1.2,'turniket',{id:'l6-turnstile'}),plant(17,6),plant(6,-10)],
    npcs:[npc('reception',12,-2.5,[[12,-2.5],[15,-2.5]],95,11,.7),npc('hr',3,8,[[3,8],[7,8],[7,2],[3,2]],82,9.5,1.3),npc('coworker',-5,-2,[[-5,-2],[-12,-2],[-12,3],[-5,3]],72,8,1.2)],
    checkpoints:[cp(5,-3)],
    interactions:[it('pickup-badge',-2,8,'Sebrat přístupovou kartu'),it('pickup-headset',-14,8,'Sebrat headset'),it('badge-door',11,-5.2,'Přiložit badge k turniketu',{requires:'badge',opens:'l6-turnstile'})]
  },
  {
    id:7,
    name:'IT incident',
    subtitle:'Servisní dveře jsou volné. Jen před nimi stojí IT.',
    objective:'Zasekni tiskárnu, odlákej IT od servisních dveří, pak dveře otevři a projdi.',
    hint:'Dveře můžeš otevřít kdykoli, ale IT před nimi stojí jako fyzická překážka, dokud ho neodlákáš.',
    theme:{floor:0x555d65,wall:0xd7dce0,accent:0xc49cff,fog:0x949da5,bg:0x848e96},
    size:[44,30], start:[-18,11], exit:[18,-11], timePar:125,
    obstacles:[...perimeter(44,30),desk(-16,10),desk(-10,10),desk(-4,10),desk(3,10),box(0,5,1.20,.82,1.00,'tiskárna'),
      wall(8,-10.7,.35,8.6),wall(8,5.7,.35,18.6),box(8,-5,.35,2.4,2.8,'dveře',{id:'l7-service-door',door:true}),plant(-15,-7),plant(16,7)],
    npcs:[npc('it',6.65,-5,[[6.65,-5]],76,9,1.3,{id:'itGate',hardBlock:true,gateRadius:1.35,gateHint:'IT stojí přímo před servisními dveřmi. Zasekni tiskárnu a odlákej ho.'}),npc('it',-9,-9,[[-9,-9],[-3,-9],[-3,-5],[-9,-5]],72,8,1.25),npc('boss',15,9,[[15,9],[18,9],[18,3],[15,3]],84,10,1.15)],
    checkpoints:[cp(10,-5)],
    interactions:[it('printerjam',0,5,'Zaseknout tiskárnu',{targetIds:['itGate'],duration:15}),it('door',7.3,-5,'Otevřít servisní dveře',{opens:'l7-service-door'}),it('workspot',-10,9.1,'Předstírat práci')]
  },
  {
    id:8,
    name:'Obědový Battle Royale',
    subtitle:'Tentokrát nic povinného. Jen čas, trasa a konkurence.',
    objective:'Dostaň se k obědu dřív než rival. Diverze jsou skutečná výhoda, ne podmínka dokončení.',
    hint:'Rival vyráží s tebou. Občerstvení a mikrovlnka mohou zdržet NPC na kratší trase.',
    theme:{floor:0x675d55,wall:0xe8e0d8,accent:0xffdd6e,fog:0xb2a9a1,bg:0xa1978f},
    size:[46,30], start:[-19,11], exit:[19,-11], timePar:92, lunchRace:true,
    obstacles:[...perimeter(46,30),desk(-16,9),desk(-10,9),desk(-4,9),desk(2,9),desk(8,9),desk(-16,4),desk(-10,4),desk(-4,4),desk(2,4),desk(8,4),wall(7,-4,.35,13),wall(14,-4,.35,13),box(10,-1,3.2,1.5,1.05,'kuchyňská linka'),box(-1,-8,8,.25,2.5,'skleněná příčka'),plant(17,5),plant(-17,-5)],
    npcs:[npc('rival',-17,11,[[-17,11],[-7,1],[2,-4],[10,-9],[19,-11]],65,6,2.3),npc('coworker',4,-6,[[4,-6],[1,-6],[1,-2],[4,-2]],70,8,1.2),npc('pm',15,7,[[15,7],[19,7],[19,3],[15,3]],76,8.5,1.5)],
    checkpoints:[cp(-5,1),cp(8,-7)],
    interactions:[it('snacks',10,-1,'Oznámit občerstvení v kuchyňce',{radius:18,duration:13}),it('microwave',7,-1,'Spustit mikrovlnku',{radius:9,duration:8})]
  },
  {
    id:9,
    name:'Meeting Maze',
    subtitle:'Dva průchody. Dva lidé. Dvě kancelářské slabosti.',
    objective:'Meeting odláká kolegu z prvního průchodu. Projektor odláká PM z druhého. Pak otevři poslední dveře.',
    hint:'Každá akce mění skutečné rozmístění NPC. Bez obou diverzí jsou oba úzké průchody obsazené.',
    theme:{floor:0x4c5963,wall:0xdae1e6,accent:0x79f0df,fog:0x93a0a8,bg:0x829099},
    size:[48,32], start:[-20,12], exit:[20,-12], timePar:138,
    obstacles:[...perimeter(48,32),desk(-19,10),desk(-15,10),
      wall(-5,-6.15,.35,19.7),wall(-5,11.15,.35,9.7),
      wall(7,-10.65,.35,10.7),wall(7,6.15,.35,19.7),box(7,-5,.35,2.6,2.8,'dveře',{id:'l9-final-door',door:true}),
      box(1,5,3,1.2,1.1,'projektorový stůl'),plant(18,9),plant(-18,-8)],
    npcs:[npc('coworker',-5,5,[[ -5,5]],80,9,1.2,{id:'meetingGate',hardBlock:true,gateRadius:1.35,gateHint:'Kolega drží první průchod. Svolej meeting na druhém konci patra.'}),npc('pm',5.65,-5,[[5.65,-5]],84,9.5,1.5,{id:'projectorGate',hardBlock:true,gateRadius:1.35,gateHint:'PM hlídá druhý průchod. Zapni projektor, aby šel řešit prezentaci.'}),npc('boss',17,-9,[[17,-9],[12,-9],[12,-13],[17,-13]],86,10,1.15)],
    checkpoints:[cp(-2,5),cp(10,-5)],
    interactions:[it('meeting',-17,10,'Rezervovat poradu na druhém konci patra',{targetIds:['meetingGate'],duration:15}),it('projector',1,5,'Zapnout projektor a prezentaci',{targetIds:['projectorGate'],duration:14}),it('door',6.3,-5,'Otevřít poslední dveře',{opens:'l9-final-door'})]
  },
  {
    id:10,
    name:'16:59',
    subtitle:'Finále už netestuje checklist. Testuje pochopení kanceláře.',
    objective:'Překonej tři logické překážky: ukecaného kolegu, šéfa v průchodu a badge turniket. Dostaň se ven před 17:00.',
    hint:'1) desky NEBO meeting na ukecaného kolegu · 2) kafe/snacky/kopírka na šéfa · 3) badge na turniket.',
    theme:{floor:0x414851,wall:0xdde1e4,accent:0xd9ff5b,fog:0x858f98,bg:0x76818b},
    size:[54,36], start:[-23,14], exit:[23,-16], timePar:165, timeLimit:180,
    obstacles:[...perimeter(54,36),desk(-21,13),desk(-16,13),desk(-21,8),desk(-16,8),desk(-4,13),desk(1,13),desk(-4,8),desk(1,8),desk(13,8),desk(18,8),
      wall(-10,-5.65,.35,24.7),wall(-10,13.65,.35,8.7),
      wall(6,-10.65,.35,14.7),wall(6,8.65,.35,18.7),
      box(0,4,3,1.3,1.1,'kuchyňská linka'),box(0,-6,1.20,.82,1.18,'kopírka'),
      wall(-7.25,-13,39.5,.35),wall(21.25,-13,11.5,.35),box(14,-13,3,.8,1.2,'turniket',{id:'l10-turnstile'}),box(19,-10,5,1.5,1.15,'recepce'),plant(23,10),plant(-22,-10)],
    npcs:[npc('chatter',-10,8,[[-10,8]],88,9,1.25,{id:'finalChatter',hardBlock:true,gateRadius:1.35,passItem:'folder',gateHint:'První blokáda: desky nebo meeting. Bez toho tě kolega nepustí.'}),npc('boss',6,-2,[[6,-2]],94,11,1.25,{id:'finalBoss',hardBlock:true,gateRadius:1.4,gateHint:'Šéf blokuje jediný průchod. Odlákej ho kancelářskou katastrofou.'}),npc('pm',-2,-2,[[-2,-2],[-7,-2],[-7,3],[-2,3]],80,9,1.5),npc('hr',12,4,[[12,4],[18,4],[18,9],[12,9]],82,9.5,1.3),npc('reception',19,-11.5,[[19,-11.5],[22,-11.5]],96,11.5,.75)],
    checkpoints:[cp(-7,8),cp(9,-2),cp(14,-11)],
    interactions:[it('pickup-folder',-20,12,'Sebrat desky'),it('meeting',-22,10,'Svolat mimořádný meeting',{targetIds:['finalChatter'],duration:14}),it('pickup-badge',-2,11,'Sebrat badge'),it('coffee',0,4,'Spustit čištění kávovaru',{targetIds:['finalBoss'],duration:12}),it('snacks',2,2,'Oznámit občerstvení',{targetIds:['finalBoss'],duration:13}),it('copier',0,-6,'Poslat 1000 kopií',{targetIds:['finalBoss'],duration:14}),it('pickup-headset',-4,12,'Sebrat headset'),it('badge-door',14,-12.2,'Přiložit badge k turniketu',{requires:'badge',opens:'l10-turnstile'})]
  }
];
