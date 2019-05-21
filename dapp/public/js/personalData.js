initializeTable();

/**
 * TR EXAMPLE
 *      <tr>
 *          <td><input type="checkbox" name="index[2]" value="file32"></td>
 *          <td>File32</td>
 *          <td>Laboratory</td>
 *          <td><a href="#"> Lab results ordered by Ferris, John MD</a></td>
 *          <td>Lab Diagnostics Inc</td>
 *          <td>2019-03-03 17:56</td>
 *          <td><button><a href="#"><span class="edit"></span>Edit</a></button></td>
 *      </tr>
 */



function initializeTable() {

    let number_of_rows = 10;
    let tbody = document.querySelector("tbody");
    if (tbody) {
        for (let i = 0; i < number_of_rows; i++) {
            let row = tbody.insertRow(0);
            row.insertCell(0).innerHTML = `<input type="checkbox" name="index[2]" value="${faker.random.number()}">`;
            row.insertCell(1).innerHTML = `${faker.system.fileName()}`;
            row.insertCell(2).innerHTML = `${faker.commerce.department()}`;
            row.insertCell(3).innerHTML = `<a href="#">${faker.lorem.words()} by ${faker.name.title()}. ${faker.name.lastName()}`;
            row.insertCell(4).innerHTML = `${faker.company.companyName()}`;
            row.insertCell(5).innerHTML = `${faker.date.month()} 2019`;
            row.insertCell(6).innerHTML = `<button><a href="#"><span class="edit"></span>Edit</a></button>`;
        }
    }


}