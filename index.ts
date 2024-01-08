const fs = require("fs");
const readline = require("readline");

interface Data {
  origens: number;
  destinos: number;
  capacidadesM: number[];
  demandasN: number[];
  matriz: number[][];
}

async function main() {
  const data: Data = await lerArquivo();

  menorCusto(
    data.origens,
    data.destinos,
    data.capacidadesM,
    data.demandasN,
    data.matriz
  );
}

main();

function menorCusto(
  numeroOrigens: number,
  numeroDestinos: number,
  capacidadesM: number[],
  demandasN: number[],
  matrizCustoTransporte: number[][]
) {
  // esse vetor e apenas para ter a mesma base visual para a analise do comportamento do algoritmo
  // a cada iteracao
  // ele e preenchido totalmente com 0 para acompanhar as modificacoes
  let vetorModificado: Array<Array<number>> = [...matrizCustoTransporte].map(
    (rows) => {
      let n = rows.map((val) => 0);

      return n;
    }
  );
  // matriz do mesmo tamanho da matriz de custo com booleanos
  // true para percorrido e false para nao percorrido
  let casasPercorridas: Array<Array<boolean>> = [...matrizCustoTransporte].map(
    (rows) => {
      let n = rows.map((val) => false);

      return n;
    }
  );
  // condicao de parada
  let todasAsCasasForamPercorridas = false;

  while (!todasAsCasasForamPercorridas) {
    const posicaoMenorValor = encontrarPontoMenorCustoTransporte(
      numeroOrigens,
      numeroDestinos,
      matrizCustoTransporte,
      casasPercorridas
    );
    // marca a casa como percorrida
    casasPercorridas[posicaoMenorValor[0]][posicaoMenorValor[1]] = true;
    // calculo para suprir a demanda
    const oferta = capacidadesM[posicaoMenorValor[0]];
    const demanda = demandasN[posicaoMenorValor[1]];
    // variavel para determinar o quanto pode-se retirar tanto da oferta quanto demanda
    let maxRetirada = 0;

    if (oferta >= demanda) {
      maxRetirada = demanda;
    } else {
      maxRetirada = oferta;
    }
    //
    vetorModificado[posicaoMenorValor[0]][posicaoMenorValor[1]] = maxRetirada;
    // caso a retirada zere a oferta e nescessario zerar todos os custos dos outros pontos
    // da linha de oferta
    if (oferta - maxRetirada === 0) {
      // atribui zero para toda a linha menos a de valor
      vetorModificado[posicaoMenorValor[0]] = vetorModificado[
        posicaoMenorValor[0]
      ].map((val) => (val == undefined ? 0 : val));

      // marca as casas como percorridas
      casasPercorridas[posicaoMenorValor[0]] = vetorModificado[
        posicaoMenorValor[0]
      ].map((val) => true);
    }
  
    //Bom agora e so fazer as retiradas tanto da oferta quanto da demanda
    capacidadesM[posicaoMenorValor[0]] = oferta - maxRetirada;
    demandasN[posicaoMenorValor[1]] = demanda - maxRetirada;
    // printa o passo a passo
    console.table(vetorModificado);

    // verifica se todas as casas ja foram percorridas
    todasAsCasasForamPercorridas = verificarMatriz(casasPercorridas);
  }

  const custoTotal = somarMatriz(vetorModificado, matrizCustoTransporte);

  console.log("Custo Total: " + custoTotal);
}

function encontrarPontoMenorCustoTransporte(
  numeroOrigens: number,
  numeroDestinos: number,
  matrizCustoTransporte: number[][],
  casasPercorridas: boolean[][]
) {
  // posicao do menor valor encontrado
  let posicaoMenorValor: number[] = [];
  for (let origemIndex = 0; origemIndex < numeroOrigens; origemIndex++) {
    for (let destinoIndex = 0; destinoIndex < numeroDestinos; destinoIndex++) {
      const valorAtual = matrizCustoTransporte[origemIndex][destinoIndex];

      // casa ja percorrida
      if (casasPercorridas[origemIndex][destinoIndex] === true) {
        continue;
      }
      // caso ainda nao foi instanciado ja pega o primeiro e atribui o valor
      if (!posicaoMenorValor.length) {
        posicaoMenorValor = [origemIndex, destinoIndex];
      }

      const menorValor =
        matrizCustoTransporte[posicaoMenorValor[0]][posicaoMenorValor[1]];

      // caso encontre um valor menor do que o atual atribui
      if (valorAtual < menorValor) {
        posicaoMenorValor = [origemIndex, destinoIndex];
      }
    }
  }

  return posicaoMenorValor;
}

function somarMatriz(matriz: number[][], matrizCustoTransporte: number[][]) {
  let soma = 0;
  for (let i = 0; i < matriz.length; i++) {
    for (let j = 0; j < matriz[i].length; j++) {
      soma += matriz[i][j] * matrizCustoTransporte[i][j];
    }
  }

  return soma;
}

function verificarMatriz(matriz: boolean[][]) {
  for (let i = 0; i < matriz.length; i++) {
    for (let j = 0; j < matriz[i].length; j++) {
      if (matriz[i][j] === false) {
        return false;
      }
    }
  }

  return true;
}

// funcao para fazer a leitura do arquivo input.txt
async function lerArquivo() {
  let data: Data = {
    origens: 0,
    destinos: 0,
    capacidadesM: [],
    demandasN: [],
    matriz: [],
  };
  const linhas = await getLinhas("input.txt");

  data.origens = parseInt(linhas[0]);
  data.destinos = parseInt(linhas[1]);
  data.capacidadesM = linhas[2]
    .split(" ")
    .map((stringNumerica) => parseInt(stringNumerica));
  data.demandasN = linhas[3]
    .split(" ")
    .map((stringNumerica) => parseInt(stringNumerica));

  let linhaAtual = 4;

  while (linhas[linhaAtual] !== undefined) {
    const arrayDeNumeros = linhas[linhaAtual]
      .split(" ")
      .map((stringNumerica) => parseInt(stringNumerica));

    data.matriz.push(arrayDeNumeros);

    linhaAtual++;
  }

  return data;
}

async function getLinhas(filePath: string) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // armazena as linhas em um vetor
  let linhas: string[] = [];
  for await (const line of rl) {
    linhas.push(line);
  }

  return linhas;
}

// DATASET DE TESTES

// o mesmo dataset do exemplo do material disponibilizado
// const data = {
//   origens: 3,
//   destinos: 4,
//   capacidadesM: [15, 25, 10],
//   demandasN: [5, 15, 15, 15],
//   matriz: [
//     [10, 2, 20, 11],
//     [12, 7, 9, 20],
//     [4, 14, 16, 18],
//   ],
// };

// outro dataset que peguei de um video de um exemplo de uma aula do youtube
// const data = {
//   origens: 3,
//   destinos: 3,
//   capacidadesM: [6, 8, 10],
//   demandasN: [7, 6, 7],
//   matriz: [
//     [2, 3, 4],
//     [3, 2, 4],
//     [2, 2, 1],
//   ],
// };
