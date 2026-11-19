export const casas=[
 {name:'Bairro da Figueira',at:0,sky:0xf4ddbd,light:0xffe5b6,color:0x628148,pace:20,tip:0,host:'Clara',detail:'Almoço tranquilo no bairro. Chegadas a cada 20 segundos.'},
 {name:'Trattoria das Videiras',at:6,sky:0xf7c695,light:0xffcc93,color:0x823f56,pace:16,tip:2,host:'Elisa',detail:'Famílias chegam a cada 16 segundos. A casa paga R$ 2 por entrega.'},
 {name:'Rua do Neon',at:14,sky:0x34334f,light:0xec9be2,color:0xa74cb3,pace:12,tip:3,host:'Gael',detail:'Turno da noite. Chegadas a cada 12 segundos e R$ 3 extras por entrega.'},
 {name:'Varanda da Praia',at:22,sky:0xa5dfe5,light:0xffecb5,color:0x188a89,pace:15,tip:4,host:'Marina',detail:'Turistas chegam a cada 15 segundos. R$ 4 extras por entrega.'},
 {name:'Chalé da Serra',at:32,sky:0xc4d7cd,light:0xffc088,color:0x526954,pace:18,tip:5,host:'Iara',detail:'Jantar na serra. Chegadas a cada 18 segundos e R$ 5 extras por entrega.'},
 {name:'Praça Central',at:45,sky:0xbacde4,light:0xffe6c5,color:0x31699c,pace:11,tip:5,host:'Ari',detail:'Almoço dos escritórios. Chegadas a cada 11 segundos e R$ 5 extras.'},
 {name:'Festival das Fatias',at:60,sky:0xffba97,light:0xffbd84,color:0xcf673e,pace:9,tip:6,host:'Sol',detail:'Visitantes chegam a cada 9 segundos. Cada entrega rende R$ 6 extras.'}
];
const encounters=[null,
 {name:'Domingo em família',qty:2,patience:240,money:18,xp:15,kind:'family'},
 {name:'Última sessão',qty:1,patience:100,money:21,xp:19,kind:'critic'},
 {name:'Mesa da varanda',qty:2,patience:220,money:23,xp:16,kind:'family'},
 {name:'Jantar da trilha',qty:2,patience:250,money:20,xp:18,kind:'family'},
 {name:'Almoço executivo',qty:1,patience:95,money:23,xp:22,kind:'critic'},
 {name:'Júri do festival',qty:1,patience:135,money:32,xp:25,kind:'critic'}
];
export function districtGuest(index,serial){return serial%3===0?encounters[index]:null}
export function restoreCasa(id,served){return Number.isInteger(id)&&casas[id]?.at<=served?id:0}

