// =======================================
// PORSCHE SALES ANALYTICS DASHBOARD
// MVP 1.1
// =======================================

let dados = [];
let dadosFiltrados = [];

let chartModelos;
let chartReceita;
let chartAno;
let chartPagamento;


// =======================================
// INICIALIZAÇÃO
// =======================================

document.addEventListener("DOMContentLoaded", carregarDashboard);


async function carregarDashboard() {

    try {

        const response = await fetch("dados.json");

        if (!response.ok) {
            throw new Error(
                `Não foi possível carregar dados.json (${response.status})`
            );
        }

        dados = await response.json();


        // Converte campos numéricos
        dados = dados.map(item => ({

            ...item,

            ModelYear:
                item.ModelYear !== null &&
                item.ModelYear !== undefined
                    ? Number(item.ModelYear)
                    : null,

            Price:
                item.Price !== null &&
                item.Price !== undefined
                    ? Number(item.Price)
                    : 0

        }));


        preencherFiltros();

        aplicarFiltros();


        // Eventos dos filtros

        document
            .getElementById("modelo")
            .addEventListener("change", aplicarFiltros);

        document
            .getElementById("ano")
            .addEventListener("change", aplicarFiltros);

        document
            .getElementById("cidade")
            .addEventListener("change", aplicarFiltros);

        document
            .getElementById("pagamento")
            .addEventListener("change", aplicarFiltros);

        document
            .getElementById("btnLimpar")
            .addEventListener("click", limparFiltros);


    } catch (erro) {

        console.error(
            "Erro ao carregar os dados:",
            erro
        );

    }

}



// =======================================
// PREENCHER FILTROS
// =======================================

function preencherFiltros() {

    preencherSelect(
        "modelo",
        "Model"
    );

    preencherSelect(
        "ano",
        "ModelYear",
        true
    );

    preencherSelect(
        "cidade",
        "City"
    );

    preencherSelect(
        "pagamento",
        "PayMethod"
    );

}



function preencherSelect(
    id,
    campo,
    numerico = false
) {

    const select =
        document.getElementById(id);


    const valores =
        [...new Set(

            dados
                .map(item => item[campo])

                .filter(valor =>
                    valor !== null &&
                    valor !== undefined &&
                    valor !== ""
                )

        )];


    valores.sort((a, b) => {

        if (numerico) {

            return Number(a) - Number(b);

        }

        return String(a)
            .localeCompare(
                String(b),
                "pt-BR"
            );

    });


    valores.forEach(valor => {

        const option =
            document.createElement("option");

        option.value = valor;

        option.textContent = valor;

        select.appendChild(option);

    });

}



// =======================================
// LIMPAR FILTROS
// =======================================

function limparFiltros() {

    document.getElementById("modelo").value = "";

    document.getElementById("ano").value = "";

    document.getElementById("cidade").value = "";

    document.getElementById("pagamento").value = "";


    aplicarFiltros();

}



// =======================================
// APLICAR FILTROS
// =======================================

function aplicarFiltros() {

    const modelo =
        document.getElementById("modelo").value;

    const ano =
        document.getElementById("ano").value;

    const cidade =
        document.getElementById("cidade").value;

    const pagamento =
        document.getElementById("pagamento").value;


    dadosFiltrados =
        dados.filter(item =>

            (!modelo ||
                item.Model === modelo) &&

            (!ano ||
                String(item.ModelYear) === String(ano)) &&

            (!cidade ||
                item.City === cidade) &&

            (!pagamento ||
                item.PayMethod === pagamento)

        );


    atualizarKPIs();

    atualizarGraficos();

    atualizarInsights();

}



// =======================================
// KPIs
// =======================================

function atualizarKPIs() {

    const total =
        dadosFiltrados.length;


    const receita =
        dadosFiltrados.reduce(

            (soma, item) =>
                soma + Number(item.Price || 0),

            0

        );


    const ticket =
        total === 0
            ? 0
            : receita / total;


    // TOTAL DE VENDAS

    document
        .getElementById("kpiTotal")
        .innerText = total;


    // RECEITA

    document
        .getElementById("kpiReceita")
        .innerText =

        receita.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );


    // TICKET MÉDIO

    document
        .getElementById("kpiTicket")
        .innerText =

        ticket.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );


    // MODELO LÍDER

    const rankingModelos =
        contarPorCampo(
            dadosFiltrados,
            "Model"
        );


    const modeloLider =
        rankingModelos.length > 0
            ? rankingModelos[0][0]
            : "-";


    document
        .getElementById("kpiModelo")
        .innerText = modeloLider;

}



// =======================================
// ATUALIZAR GRÁFICOS
// =======================================

function atualizarGraficos() {

    criarGraficoModelos();

    criarGraficoReceita();

    criarGraficoAno();

    criarGraficoPagamento();

}



// =======================================
// GRÁFICO 1
// TOP 10 MODELOS MAIS VENDIDOS
// =======================================

function criarGraficoModelos() {

    if (chartModelos) {

        chartModelos.destroy();

    }


    const ranking =
        contarPorCampo(
            dadosFiltrados,
            "Model"
        )
        .slice(0, 10);


    chartModelos =
        new Chart(

            document.getElementById(
                "chartModelos"
            ),

            {

                type: "bar",


                data: {

                    labels:
                        ranking.map(
                            item => item[0]
                        ),


                    datasets: [{

                        label:
                            "Quantidade de Vendas",

                        data:
                            ranking.map(
                                item => item[1]
                            ),

                        backgroundColor:
                            "#D5001C",

                        borderRadius: 4

                    }]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    plugins: {

                        legend: {

                            display: false

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        return (
                                            context.raw +
                                            " venda(s)"
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                precision: 0

                            }

                        }

                    }

                }

            }

        );

}



// =======================================
// GRÁFICO 2
// TOP 10 CIDADES POR RECEITA
// =======================================

function criarGraficoReceita() {

    if (chartReceita) {

        chartReceita.destroy();

    }


    const resumo = {};


    dadosFiltrados.forEach(item => {

        const cidade =
            item.City || "Não informado";


        resumo[cidade] =
            (resumo[cidade] || 0) +
            Number(item.Price || 0);

    });


    const ranking =
        Object.entries(resumo)

            .sort(
                (a, b) =>
                    b[1] - a[1]
            )

            .slice(0, 10);


    chartReceita =
        new Chart(

            document.getElementById(
                "chartReceita"
            ),

            {

                type: "bar",


                data: {

                    labels:
                        ranking.map(
                            item => item[0]
                        ),


                    datasets: [{

                        label: "Receita",

                        data:
                            ranking.map(
                                item => item[1]
                            ),

                        backgroundColor:
                            "#111111",

                        borderRadius: 4

                    }]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    plugins: {

                        legend: {

                            display: false

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        return Number(
                                            context.raw
                                        )
                                        .toLocaleString(
                                            "pt-BR",
                                            {
                                                style:
                                                    "currency",

                                                currency:
                                                    "BRL"
                                            }
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero: true,


                            ticks: {

                                callback:
                                    function(value) {

                                        return (
                                            "R$ " +
                                            Number(value)
                                            .toLocaleString(
                                                "pt-BR"
                                            )
                                        );

                                    }

                            }

                        }

                    }

                }

            }

        );

}



// =======================================
// GRÁFICO 3
// VENDAS POR MODEL YEAR
// =======================================

function criarGraficoAno() {

    if (chartAno) {

        chartAno.destroy();

    }


    const resumo = {};


    dadosFiltrados.forEach(item => {

        if (
            item.ModelYear !== null &&
            item.ModelYear !== undefined &&
            item.ModelYear !== ""
        ) {

            resumo[item.ModelYear] =
                (resumo[item.ModelYear] || 0)
                + 1;

        }

    });


    const ranking =
        Object.entries(resumo)

            .sort(
                (a, b) =>
                    Number(a[0]) -
                    Number(b[0])
            );


    chartAno =
        new Chart(

            document.getElementById(
                "chartAno"
            ),

            {

                type: "bar",


                data: {

                    labels:
                        ranking.map(
                            item => item[0]
                        ),


                    datasets: [{

                        label: "Vendas",

                        data:
                            ranking.map(
                                item => item[1]
                            ),

                        backgroundColor:
                            "#666666",

                        borderRadius: 4

                    }]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    plugins: {

                        legend: {

                            display: false

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                precision: 0

                            }

                        }

                    }

                }

            }

        );

}



// =======================================
// GRÁFICO 4
// FORMAS DE PAGAMENTO
// =======================================

function criarGraficoPagamento() {

    if (chartPagamento) {
        chartPagamento.destroy();
    }

    const ranking =
        contarPorCampo(
            dadosFiltrados,
            "PayMethod"
        );

    const cores = [
        "#D5001C",
        "#111111",
        "#555555",
        "#777777",
        "#999999",
        "#BBBBBB",
        "#7A000F",
        "#333333",
        "#DDDDDD"
    ];

    chartPagamento =
        new Chart(
            document.getElementById(
                "chartPagamento"
            ),
            {
                type: "doughnut",

                data: {

                    labels:
                        ranking.map(
                            item => item[0]
                        ),

                    datasets: [{
                        label: "Vendas",

                        data:
                            ranking.map(
                                item => item[1]
                            ),

                        backgroundColor:
                            cores.slice(
                                0,
                                ranking.length
                            ),

                        borderColor: "#FFFFFF",
                        borderWidth: 2
                    }]
                },

                options: {

                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: true,
                            position: "right"
                        },

                        tooltip: {

                            callbacks: {

                                label: function(context) {

                                    const total =
                                        context.dataset.data.reduce(
                                            (a, b) => a + b,
                                            0
                                        );

                                    const qtd =
                                        context.raw;

                                    const percentual =
                                        total > 0
                                            ? ((qtd / total) * 100).toFixed(1)
                                            : 0;

                                    return (
                                        context.label +
                                        ": " +
                                        qtd +
                                        " venda(s) - " +
                                        percentual +
                                        "%"
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
}



// =======================================
// INSIGHTS AUTOMÁTICOS
// =======================================

function atualizarInsights() {

    const painel =
        document.getElementById(
            "insights"
        );


    const total =
        dadosFiltrados.length;


    if (total === 0) {

        painel.innerHTML = `

            <li>
                Nenhuma venda encontrada
                para os filtros selecionados.
            </li>

        `;

        return;

    }


    const rankingModelos =
        contarPorCampo(
            dadosFiltrados,
            "Model"
        );


    const rankingCidades =
        contarPorCampo(
            dadosFiltrados,
            "City"
        );


    const rankingPagamentos =
        contarPorCampo(
            dadosFiltrados,
            "PayMethod"
        );


    const rankingAnos =
        contarPorCampo(
            dadosFiltrados,
            "ModelYear"
        );


    const modelo =
        rankingModelos[0];


    const cidade =
        rankingCidades[0];


    const pagamento =
        rankingPagamentos[0];


    const ano =
        rankingAnos[0];


    const receita =
        dadosFiltrados.reduce(

            (soma, item) =>
                soma +
                Number(item.Price || 0),

            0

        );


    const percentualModelo =
        (
            (modelo[1] / total)
            * 100
        ).toFixed(1);


    const percentualCidade =
        (
            (cidade[1] / total)
            * 100
        ).toFixed(1);


    const percentualPagamento =
        (
            (pagamento[1] / total)
            * 100
        ).toFixed(1);


    painel.innerHTML = `

        <li>

            <strong>
                Modelo mais vendido:
            </strong>

            ${modelo[0]},
            com ${modelo[1]} venda(s)
            (${percentualModelo}% da seleção).

        </li>


        <li>

            <strong>
                Cidade com maior volume:
            </strong>

            ${cidade[0]},
            com ${cidade[1]} venda(s)
            (${percentualCidade}% da seleção).

        </li>


        <li>

            <strong>
                Forma de pagamento predominante:
            </strong>

            ${pagamento[0]},
            com ${pagamento[1]} venda(s)
            (${percentualPagamento}% da seleção).

        </li>


        <li>

            <strong>
                Ano de modelo com maior volume:
            </strong>

            ${ano[0]},
            com ${ano[1]} venda(s).

        </li>


        <li>

            <strong>
                Receita da seleção:
            </strong>

            ${receita.toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            )}

        </li>

    `;

}



// =======================================
// FUNÇÃO AUXILIAR
// RANKING POR CAMPO
// =======================================

function contarPorCampo(
    lista,
    campo
) {

    const resumo = {};


    lista.forEach(item => {

        const valor =
            item[campo];


        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {

            return;

        }


        resumo[valor] =
            (resumo[valor] || 0) + 1;

    });


    return Object.entries(resumo)

        .sort((a, b) => {

            if (b[1] !== a[1]) {

                return b[1] - a[1];

            }


            return String(a[0])
                .localeCompare(
                    String(b[0]),
                    "pt-BR"
                );

        });

}