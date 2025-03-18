import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }
    getDescriptions() {
        return [getCreatureDescription(this), super.getDescriptions()];
    }
}
// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

function isLad(card) {
    return card instanceof Lad && Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') && Lad.prototype.hasOwnProperty('modifyTakenDamage')
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isLad(card)) {
        return 'Чем их больше, тем они сильнее'
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}



class Duck extends Creature{
    constructor(name = 'Мирная утка', maxPower = 2, image = 'sheriff.png'){
        super(name,maxPower,image);    
    }
    
    quacks() { 
        console.log('quack') 
    };
    
    swims() { 
        console.log('float:both;') 
    };
}

class Dog extends Creature{
    constructor(name = 'Пес-бандит',maxPower = 3, image = 'bandit.png'){
        super(name,maxPower,image);
    }
}

class Trasher extends Dog{
    constructor(name = 'Громила',maxPower = 5,image = 'femboy.png'){
        super(name,maxPower,image);
    }
    modifyTakenDamage(value, fromCard, gameContext, continuation){
        this.view.signalAbility(()=> {this.view.signalDamage(continuation(0))});
        continuation(value - 1);
    }
    getDescription(){
        return [
            getInheritanceDescription(this)
        ];
    }
}
class Gatling extends Creature{
    constructor(name = "Гатлинг", power = 6) {
        super(name, power, null);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        for (let card of oppositePlayer.table) {
            taskQueue.push(onDone => {
                this.dealDamageToCreature(2, card, gameContext, onDone);
            });
        }

        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog{
    constructor(name = "Браток", power = 2) {
        super(name, 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        Lad.setInGameCount(Lad.inGameCount + 1);
        continuation();
    };

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.inGameCount - 1);
        continuation();
    };

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    };

    modifyTakenDamage (value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    };

    static getBonus() {
        return this.getInGameCount() * (this.getInGameCount() + 1) / 2;
    }
}

class PseudoDuck extends Dog{
    constructor(name = "Псевдоутка", power = 3) {
        super(name, power);
    }

    quacks() {
        console.log('quack')
    };

    swims() {
        console.log('float:both;')
    };
}

class Brewer extends Duck{
    constructor(name = "Пивовар", power = 2, image = 'krasnopuzoff-sticker.png') {
        super(name, power, image);
    }

    attack(gameContext, continuation) {
        const allCards = gameContext.currentPlayer.table.concat(gameContext.oppositePlayer.table);
        allCards.forEach(card => {
            if (isDuck(card)) {
                card.maxPower = card.maxPower + 1;
                card.currentPower = card.currentPower + 2;
                card.view.signalHeal(() => {
                    card.updateView();
                });
            }
        });
        super.attack(gameContext, continuation);
    }

}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new PseudoDuck(),
    new Brewer(),
];


// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Trasher(),
    new Lad(),
    new Lad(),
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});


