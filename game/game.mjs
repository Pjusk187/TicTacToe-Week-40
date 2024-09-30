import { print, askQuestion } from "./io.mjs";
import { debug, DEBUG_LEVELS } from "./debug.mjs";
import { ANSI } from "./ansi.mjs";
import DICTIONARY from "./language.mjs";
import showSplashScreen from "./splash.mjs";

const GAME_BOARD_SIZE = 3;
const PLAYER_1 = 1;
const PLAYER_2 = -1;

const PLAYER_1_STRING = "X ";
const PLAYER_2_STRING = "O ";
const UNPLACED_CELL_STRING = "_ ";

// These are the valid choices for the menu.
const MENU_CHOICES = {
  MENU_CHOICE_START_GAME: 1,
  MENU_CHOICE_PVC: 2,
  MENU_CHOICE_SHOW_SETTINGS: 3,
  MENU_CHOICE_EXIT_GAME: 4,
};

const DRAW_RETURN_VALUE = "DRAW";
const TIMEOUT_DELAY = 2500;

const NO_CHOICE = -1;

let language = DICTIONARY.en;
let gameboard;
let currentPlayer;

clearScreen();
showSplashScreen();
setTimeout(start, TIMEOUT_DELAY); // This waites 2.5seconds before calling the function. i.e. we get to see the splash screen for 2.5 seconds before the menue takes over.

//#region game functions -----------------------------

async function start() {
  do {
    let chosenAction = NO_CHOICE;
    chosenAction = await showMenu();

    if (chosenAction == MENU_CHOICES.MENU_CHOICE_START_GAME) {
      await runGame();
    } else if (chosenAction == MENU_CHOICES.MENU_CHOICE_PVC) {
      await runGamePvC();
    } else if (chosenAction == MENU_CHOICES.MENU_CHOICE_SHOW_SETTINGS) {
      await showSettings();
    } else if (chosenAction == MENU_CHOICES.MENU_CHOICE_EXIT_GAME) {
      clearScreen();
      process.exit();
    }
  } while (true);
}

function getFirstAvailableMove() {
  for (let row = 0; row < GAME_BOARD_SIZE; row++) {
    for (let col = 0; col < GAME_BOARD_SIZE; col++) {
      if (gameboard[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

async function runGamePvC() {
  let isPlaying = true;
  currentPlayer = PLAYER_1;

  while (isPlaying) {
    initializeGame();
    isPlaying = await playGamePvC();
  }
}

async function playGamePvC() {
  let outcome;
  do {
    clearScreen();
    showGameBoardWithCurrentState();
    showHUD();

    if (currentPlayer == PLAYER_1) {
      let move = await getGameMoveFromtCurrentPlayer();
      updateGameBoardState(move);
    } else {
      print(language.AI_TURN_PROMPT);
      await new Promise((resolve) => setTimeout(resolve, TIMEOUT_DELAY));
      let move = getFirstAvailableMove();
      updateGameBoardState(move);
    }

    outcome = evaluateGameState();
    changeCurrentPlayer();
  } while (outcome == 0);

  showGameSummary(outcome);

  return await askWantToPlayAgain();
}

async function showSettings() {
  let chosenLanguage = null;

  do {
    clearScreen();
    print(language.SELECT_LANGUAGE);
    print("1. " + language.LANG_EN);
    print("2. " + language.LANG_NO);

    let choice = await askQuestion("");

    if (choice != "1" && choice != "2") {
      continue;
    }

    if (choice == "1") {
      language = DICTIONARY.en;
      chosenLanguage = DICTIONARY.en;
    } else if (choice == "2") {
      language = DICTIONARY.no;
      chosenLanguage = DICTIONARY.no;
    }
  } while (chosenLanguage == null);
}

async function runGame() {
  let isPlaying = true;

  while (isPlaying) {
    // Do the following until the player dos not want to play anymore.
    initializeGame(); // Reset everything related to playing the game
    isPlaying = await playGame(); // run the actual game
  }
}

async function showMenu() {
  let choice = -1; // This variable tracks the choice the player has made. We set it to -1 initially because that is not a valid choice.
  let validChoice = false; // This variable tells us if the choice the player has made is one of the valid choices. It is initially set to false because the player has made no choices.

  while (!validChoice) {
    // Display our menu to the player.
    clearScreen();
    print(ANSI.COLOR.YELLOW + language.MENU_TITLE + ANSI.RESET);
    print(language.MENU_PLAY_GAME);
    print(language.MENU_PVC_GAME);
    print(language.MENU_SETTINGS);
    print(language.MENU_EXIT);

    // Wait for the choice.
    choice = await askQuestion("");

    // Check to see if the choice is valid.
    if (
      [
        MENU_CHOICES.MENU_CHOICE_START_GAME,
        MENU_CHOICES.MENU_CHOICE_SHOW_SETTINGS,
        MENU_CHOICES.MENU_CHOICE_PVC,
        MENU_CHOICES.MENU_CHOICE_EXIT_GAME,
      ].includes(Number(choice))
    ) {
      validChoice = true;
    }
  }

  return choice;
}

async function playGame() {
  // Play game..
  let outcome;
  do {
    clearScreen();
    showGameBoardWithCurrentState();
    showHUD();
    let move = await getGameMoveFromtCurrentPlayer();
    updateGameBoardState(move);
    outcome = evaluateGameState();
    changeCurrentPlayer();
  } while (outcome == 0);

  showGameSummary(outcome);

  return await askWantToPlayAgain();
}

async function askWantToPlayAgain() {
  let answer = await askQuestion(language.PLAY_AGAIN_QUESTION);
  let playAgain = true;
  if (answer && answer.toLowerCase()[0] != language.CONFIRM) {
    playAgain = false;
  }
  return playAgain;
}

function showGameSummary(outcome) {
  clearScreen();
  if (outcome == DRAW_RETURN_VALUE) {
    print(language.DRAW);
    showGameBoardWithCurrentState();
    return;
  }
  let winningPlayer = outcome > 0 ? 1 : 2;
  print(language.WINNER + winningPlayer);
  showGameBoardWithCurrentState();
  print(language.GAME_OVER);
}

function changeCurrentPlayer() {
  currentPlayer *= -1;
}

function evaluateGameState() {
  let drawSum = 0;
  for (let row = 0; row < GAME_BOARD_SIZE; row++) {
    for (let col = 0; col < GAME_BOARD_SIZE; col++) {
      drawSum += Math.abs(gameboard[row][col]);
    }
  }
  if (drawSum == 9) {
    return DRAW_RETURN_VALUE;
  }

  let sum = 0;
  let state = 0;

  for (let row = 0; row < GAME_BOARD_SIZE; row++) {
    for (let col = 0; col < GAME_BOARD_SIZE; col++) {
      sum += gameboard[row][col];
    }

    if (Math.abs(sum) == GAME_BOARD_SIZE) {
      state = sum;
    }
    sum = 0;
  }

  for (let col = 0; col < GAME_BOARD_SIZE; col++) {
    for (let row = 0; row < GAME_BOARD_SIZE; row++) {
      sum += gameboard[row][col];
    }

    if (Math.abs(sum) == GAME_BOARD_SIZE) {
      state = sum;
    }

    sum = 0;
  }

  let mainDiagonalSum = 0;
  let antiDiagonalSum = 0;

  for (let i = 0; i < GAME_BOARD_SIZE; i++) {
    mainDiagonalSum += gameboard[i][i];
    antiDiagonalSum += gameboard[i][GAME_BOARD_SIZE - i - 1];
  }

  if (Math.abs(mainDiagonalSum) == GAME_BOARD_SIZE) {
    return mainDiagonalSum / GAME_BOARD_SIZE;
  }
  if (Math.abs(antiDiagonalSum) == GAME_BOARD_SIZE) {
    return antiDiagonalSum / GAME_BOARD_SIZE;
  }

  let finalstate = state / GAME_BOARD_SIZE;
  return finalstate;
}

function updateGameBoardState(move) {
  const ROW_ID = 0;
  const COLUMN_ID = 1;
  gameboard[move[ROW_ID]][move[COLUMN_ID]] = currentPlayer;
}

async function getGameMoveFromtCurrentPlayer() {
  let position = null;
  do {
    let rawInput = await askQuestion(language.PLACE_MARK);
    position = rawInput.split(" ");
    position[0] -= 1;
    position[1] -= 1;
  } while (isValidPositionOnBoard(position) == false);
  return position;
}

function isValidPositionOnBoard(position) {
  if (position.length < 2) {
    // We where not given two numbers or more.
    return false;
  }

  let isValidInput = true;
  if (position[0] * 1 != position[0] && position[1] * 1 != position[1]) {
    // Not Numbers
    isValidInput = false;
  } else if (
    position[0] > GAME_BOARD_SIZE - 1 ||
    position[1] > GAME_BOARD_SIZE - 1
  ) {
    // Not on board
    isValidInput = false;
  } else if (position[0] < 0 || position[1] < 0) {
    // Not on board
    isValidInput = false;
    return isValidInput;
  } else if (
    Number.parseInt(position[0]) != position[0] &&
    Number.parseInt(position[1]) != position[1]
  ) {
    // Is whole number.
    isValidInput = false;
  }

  if (Math.abs(gameboard[position[0]][position[1]]) !== 0) {
    //Is taken spot
    isValidInput = false;
  }

  return isValidInput;
}

function showHUD() {
  let playerDescription = language.PLAYER_DESCRIPTION_ONE;
  if (PLAYER_2 == currentPlayer) {
    playerDescription = language.PLAYER_DESCRIPTION_TWO;
  }
  print(language.TURN_PROMPT.replace("{PLAYER}", playerDescription));
}

function showGameBoardWithCurrentState() {
  for (let currentRow = 0; currentRow < GAME_BOARD_SIZE; currentRow++) {
    let rowOutput = "";
    for (let currentCol = 0; currentCol < GAME_BOARD_SIZE; currentCol++) {
      let cell = gameboard[currentRow][currentCol];
      if (cell == 0) {
        rowOutput += UNPLACED_CELL_STRING;
      } else if (cell > 0) {
        rowOutput += ANSI.COLOR.RED + PLAYER_1_STRING + ANSI.RESET;
      } else {
        rowOutput += ANSI.COLOR.GREEN + PLAYER_2_STRING + ANSI.RESET;
      }
    }
    print(rowOutput);
  }
}

function initializeGame() {
  gameboard = createGameBoard();
  currentPlayer = PLAYER_1;
}

function createGameBoard() {
  let newBoard = new Array(GAME_BOARD_SIZE);

  for (let currentRow = 0; currentRow < GAME_BOARD_SIZE; currentRow++) {
    let row = new Array(GAME_BOARD_SIZE);
    for (
      let currentColumn = 0;
      currentColumn < GAME_BOARD_SIZE;
      currentColumn++
    ) {
      row[currentColumn] = 0;
    }
    newBoard[currentRow] = row;
  }

  return newBoard;
}

function clearScreen() {
  console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME, ANSI.RESET);
}

//#endregion
