import { ANSI } from "./ansi.mjs";

const ART = `
  ${ANSI.COLOR.YELLOW}____________ __    _________    __ __    __________  ______
 /_  __/  _/ //_/   /_  __/   |  / //_/   /_  __/ __ \/ ____/
  ${ANSI.COLOR.RED}/ /  / // ,<       / / / /| | / ,<       / / / / / / __/   
 ${ANSI.COLOR.BLUE}/ / _/ // /| |     / / / ___ |/ /| |     / / / /_/ / /___   
/_/ /___/_/ |_|    /_/ /_/  |_/_/ |_|    /_/  \____/_____/   
                                                             
`;

function showSplashScreen() {
  console.log(ART);
}

export default showSplashScreen;
