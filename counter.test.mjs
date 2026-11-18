import assert from 'node:assert/strict';
import {storePizza, takePizza, findReadyPizza} from './counter.js';

// Reproduce the reported blockage: occupied hands, another ready pizza in oven.
const first = {stage:'ready', recipe:0, quality:.6};
const second = {stage:'ready', recipe:1, quality:1};
const hand = [first], shelf = [], oven = [second];
assert(storePizza(hand, shelf, 0));
assert.equal(hand.length, 0);
hand.push(oven.shift());
assert.equal(hand[0], second);
assert.equal(shelf[0], first);
assert.equal(takePizza(shelf, hand, 0, 1), false);
assert.equal(shelf.length, 1);
assert(storePizza(hand, shelf, 0));
assert(takePizza(shelf, hand, 0, 1));
assert.equal(hand[0], first);
assert.equal(hand[0].quality, .6);
assert.equal(new Set([...hand,...shelf,...oven]).size, 2);

// Raw pizzas may be set aside, but must never be delivered as cooked pizzas.
const raw = {stage:'raw', recipe:0, quality:1}, dough = {stage:'dough', recipe:null};
const otherHand = [raw, dough], otherShelf = [];
assert(storePizza(otherHand, otherShelf, 0));
assert(storePizza(otherHand, otherShelf, 0));
assert.equal(findReadyPizza(otherShelf, 0), undefined);
assert.equal(findReadyPizza([raw, first], 0), first);
assert(takePizza(otherShelf, otherHand, 1, 2));
assert.equal(otherHand[0], dough);
assert.equal(storePizza(otherHand, otherShelf, 9), false);
assert.equal(takePizza(otherShelf, otherHand, -1, 2), false);
assert.equal(storePizza([{stage:'baking'}], [], 0), false);
console.log('PASS: guardar, liberar mãos, retirar do forno, recuperar pizza, capacidade, qualidade, conservação e bloqueio de entrega de pizza crua.');
