const ctx = document.getElementById('expensesChart').getContext('2d');
const expensesChart = new Chart(ctx, {
 type: 'doughnut',
 data: {
 labels: ['Gastos Dia a Dia', 'Contas Fixas Mensais', 'Emergência / Imprevisto'],
datasets: [{
data: [420.00, 1250.00, 175.00], 
backgroundColor: [
                        '#38bdf8',
                        '#fbbf24', 
                        '#f87171'  
                    ],
                    borderColor: '#1e293b',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: {
                                family: 'Inter',
                                size: 13
                            },
                            padding: 20
                        }
                    }
  }
}
 });

       