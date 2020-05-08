const BASE_URL = "http://localhost:3000"
const TRAINERS_URL = `${BASE_URL}/trainers`
const POKEMONS_URL = `${BASE_URL}/pokemons`

function addErrorMessage(error) {
  let errorHeading = document.createElement('h1');

  errorHeading.textContent = error.message;
  errorHeading.className = "error-heading";
  document.body.prepend(errorHeading);
}

function deletePokemon(pokemon) {
  // console.log(`${pokemon.nickname} (${pokemon.species}) released!`);
  let POKEMON_URL = `${POKEMONS_URL}/${pokemon.id}`;

  let configObject = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    // body: JSON.stringify({
    //   pokemon_id: pokemon.id
    // }) Interesting; this isn't needed! (Probably not best practice, though.)
  };

  fetch(POKEMON_URL, configObject)
    .then(resp => resp.json())
    .then(function(deletedPokemon) {
      console.log(`${deletedPokemon.nickname} successfully released!`)
      // Update the DOM here, probably by deleting the parent of the button whose data-pokemon-id is the deletedPokemon's id.
      // I have to also update the trainer somewhere, by removing this Pokemon from their 'pokemons' object.
      // But this may not be needed at all!
    })
    .catch(error => addErrorMessage(error));
}

function addPokemon(pokemon, trainer) {
  const pokeLi = document.createElement('li');
  const releaseBtn = document.createElement('button');

  pokeLi.textContent = `${pokemon.nickname} (${pokemon.species})`;

  releaseBtn.textContent = 'Release';
  releaseBtn.className = 'release';
  releaseBtn.setAttribute('data-pokemon-id', pokemon.id);
  pokeLi.appendChild(releaseBtn);

  releaseBtn.addEventListener("click", function () {
    const pokeIndex = trainer.pokemons.indexOf(pokemon);

    deletePokemon(pokemon);
    pokeLi.remove(); // If I do this here, how do I update the trainer?
    // Now that I have the trainer here, I can remove the pokemon (I think).
    // But how to properly remove a pokemon hash from an array? Like this:
    trainer.pokemons = trainer.pokemons.splice(pokeIndex, 1);
    // That almost got it, but now I'm getting the same bug as before: Being able to add too many Pokemon after the fact!
  });

  return pokeLi;
}

function newPokemonFor (trainer, pokemonList) { // Create the new Pokemon, then call addPokemon with it.
  let configObject = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      trainer_id: trainer.id
    }) // This body technically isn't needed.
  };

  fetch(POKEMONS_URL, configObject)
    .then(resp => resp.json())
    .then(function(pokeJson) {
      pokemonList.appendChild( addPokemon(pokeJson, trainer) );
      
      // The code below fixes a bug in the "Add Pokemon" button.
      // It tells the trainer object that it has a new Pokemon.
      trainer.pokemons.push(pokeJson); 

      // return addPokemon(pokeJson);
      // newPokemon = addPokemon(pokeJson);
      // console.log(newPokemon) // None of this worked.
    })
    .catch(error => addErrorMessage(error));

  /* Originally, I tried to initialize a newPokemon at the top, then give it a value from inside the .then() callback.
   * I would then return the newPokemon and append it to the pokemonList from the createTrainerCard function.
   * The problem: The .then() callback kept overwriting the newPokemon variable, so I kept returning undefined!
   * Returning the call to fetch() didn't work either. */
}

function createTrainerCard (trainer) {
  const card = document.createElement('div');
  const trainerName = document.createElement('p');
  const addPokemonBtn = document.createElement('button');
  const pokemonList = document.createElement('ul');
  const trainerPokemons = trainer.pokemons;

  card.className = 'card';
  card.setAttribute('data-id', trainer.id);

  trainerName.textContent = trainer.name;
  card.appendChild(trainerName);

  addPokemonBtn.textContent = 'Add Pokemon';
  addPokemonBtn.setAttribute('data-trainer-id', trainer.id);
  card.appendChild(addPokemonBtn);

  for (const pokemon of trainerPokemons) {
    pokemonList.appendChild( addPokemon(pokemon, trainer) );
  }
  card.appendChild(pokemonList);

  addPokemonBtn.addEventListener("click", function() {
    // Strange bug here: If I click on the "Add Pokemon" button when the trainer has 5 or fewer Pokemon,
    // then somehow I can increase the number of Pokemon beyond the maximum limit of 6.
    // But if the document is loaded and the trainer already has 6 Pokemon, this won't happen.
    // Somehow, the trainer (at this end) doesn't know that he/she has more Pokemon!

    // Hypothesis: The trainer isn't the actual trainer, but the trainer JSON data.
    // The page never refreshes, so that JSON data never changes here.

    // The question is: What do I change? And where?
    // The solution that I found: Update the trainer object (not the model) when a new Pokemon is created!
    if (trainer.pokemons.length < 6) {
      newPokemonFor(trainer, pokemonList);
      console.log(`New Pokemon added to ${trainer.name}'s team!`);
    } else {
      console.log(`Sorry. ${trainer.name} has enough Pokemon!`);
    }
  })

  return card;
}

document.addEventListener("DOMContentLoaded", function () {
  const main = document.querySelector('main');

  fetch(TRAINERS_URL)
    .then(resp => resp.json())
    .then(function (trainersObj) {
      for (const trainer of trainersObj) {
        main.appendChild( createTrainerCard(trainer) );
      }
    })
    .catch(error => addErrorMessage(error));
});