import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import styles from './InstantChatWebPart.module.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
export interface IInstantChatWebPartProps {
  
}

export default class InstantChatWebPart extends BaseClientSideWebPart<IInstantChatWebPartProps> {

  public getItemsFromSPList(listName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let open = indexedDB.open("MyDatabase", 1);
  
      open.onsuccess = function () {
        console.log("Database opened successfully");
        let db = open.result;
        let tx = db.transaction(listName, "readonly");
        let store = tx.objectStore(listName);
  
        let getAllRequest = store.getAll();
  
        getAllRequest.onsuccess = function () {
          const usersData = getAllRequest.result.map(item => {
            return {
              UserName: item.UserName, // Assuming UserName is the user's name
              Email: item.Email, // Assuming Email is the user's email
              Company: item.GroupCompany, // Assuming Company is a column in IndexedDB
              Department: item.Department, // Assuming Department is a column in IndexedDB
              ProfilePicture: item.ProfilePicture, // Assuming ProfilePicture is a column in IndexedDB
              JobTitle: item.JobTitle // Assuming JobTitle is a column in IndexedDB
              
            };
          });
  
          resolve(usersData);
        };
  
        getAllRequest.onerror = function () {
          reject(getAllRequest.error);
        };
      };
  
      open.onerror = function () {
        reject(open.error);
      };
    });
  }
  
  

  private users: any[] = [];

  public async onInit(): Promise<void> {
    await super.onInit();
    this.users = await this.getItemsFromSPList("SPList"); // Removed '${}' around listName
  }

  private filterUsers(): void {
    const companySelect = document.getElementById('companySelect') as HTMLSelectElement;
    const departmentSelect = document.getElementById('departmentSelect') as HTMLSelectElement;
  
    const company = companySelect.value;
    const department = departmentSelect.value;
  
    // Mapping between display names and actual company names
    const companyMapping = {
      'All Companies': ['All Companies'],
      'RPG Enterprises': ['RPG Enterprises', 'rpg'],
      'Zensar': ['Zensar', 'Zensar Technologies'],
      'Harrisons Malayalam': ['Harrisons Malayalam','HML'],
      'RPGLS': ['RPG Life Sciences', 'LS'],
      'CEAT': ['CEAT'],
      'KEC': ['KEC']
    };
  
    const selectedCompany = companySelect.value;
const selectedDepartment = departmentSelect.value;

console.log('Function is being called');
console.log('Users:', this.users); 
console.log('Company names:', this.users.map(user => user.Company));

const filteredUsers = this.users.filter(user => {
  const companyMatch = selectedCompany === 'All Companies' || user.Company.toLowerCase() === selectedCompany.toLowerCase();
  const departmentMatch = selectedDepartment === 'All Departments' || user.Department.toLowerCase() === selectedDepartment.toLowerCase();
  return companyMatch && departmentMatch;
});

console.log('Filtered users:', filteredUsers);

    // Then, update the users list with the filtered users
    const suggestionsContainer = document.getElementById('col-12') as HTMLDivElement;
    this.renderSuggestions(filteredUsers, suggestionsContainer);
  }

  private getDepartmentsForCompany(company: string): string[] {
    const usersForCompany = this.users.filter(user => user.Company === company);
    const departments = [...new Set(usersForCompany.map(user => user.Department))];
    return departments;
  }

  public render(): void {
    this.domElement.innerHTML = `
  <section class="${styles.instantChat}">
    <div class="${styles.TopSection}">
      <div class="${styles.row}">
        <div class="${styles.col12}">
          <h2>Instant Chat</h2>
          <div class="${styles.FormGroup}" mt-3">
            <span class="fa fa-search  ${styles.FormControl}"></span>
            <?-- Search Bar Below-->
            <input id="InstantsearchInput" type="text" class="${styles.SearchBar}" placeholder="Search For Users">
          </div>
        </div>
      </div>
      <div class="${styles.row} mt-3">
        <div class="${styles.col6}">
          <select id="companySelect" class="form-select ${styles.Select}" aria-label="Default select example">
            <option value="All Companies" selected>All Companies</option>
            <option value="RPG Enterprises">RPG Enterprises</option>
            <option value="Zensar Technologies">Zensar</option>
            <option value="Harrisons Malayalam">Harrisons Malayalam</option>
            <option value="RPG Life Sciences">RPGLS</option>
            <option value="CEAT">CEAT</option>
            <option value="KEC">KEC</option>
            <option value = "Raychem RPG">Raychem RPG</option>
          </select>
        </div>
      
        <div class="col-6 ${styles.col6}">
          <select id="departmentSelect" class="form-select ${styles.Select}" aria-label="Default select example">
            <option selected>All Departments</option>
          </select>
        </div>
      </div>


    </div>

    <div class="${styles.BottomSection}">
      <div class="${styles.row}">
        <div class="col-12 ${styles.col12}" id="col-12">
          
        </div>
      </div>
    </div>
      
      
      
    </section>`;

    const InstantsearchInput = document.getElementById('InstantsearchInput') as HTMLInputElement | null;
  if (InstantsearchInput) {
    InstantsearchInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        this.fetchAndRenderSuggestions(InstantsearchInput.value);
      }
    });
  } else {
    console.error(`Element with ID 'InstantsearchInput' not found.`);
  }

  // Mapping between display names and actual company names used for filtering
  const companyFilterMapping = {
    "All Companies": ["All Companies"],
    "RPG Enterprises": ["RPG Enterprises", "rpg"],
    "Zensar Technologies": ["Zensar", "Zensar Technologies"],
    "Harrisons Malayalam": ["Harrisons Malayalam","HML"],
    "RPGLS": ["RPG Life Sciences", "LS"],
    "CEAT": ["CEAT"],
    "KEC": ["KEC"],
    "Raychem RPG": ["Raychem RPG"]
  };

  // Get the company dropdown
const companySelect = document.getElementById('companySelect') as HTMLSelectElement;

// Add an event listener to the company dropdown to update the department dropdown when the company changes
companySelect.addEventListener('change', () => {
  const selectedCompany = companySelect.value;
  const companyFilters = companyFilterMapping[selectedCompany as keyof typeof companyFilterMapping];

  if (!companyFilters) {
    console.error(`No filters found for company: ${selectedCompany}`);
    return;
  }

  // Get departments for each company in the filter and combine them
  const departments = companyFilters.flatMap(company => {
    const departmentsForCompany = this.getDepartmentsForCompany(company);
    if (!departmentsForCompany) {
      console.error(`No departments found for company: ${company}`);
      return [];
    }
    return departmentsForCompany;
  });

  this.updateDepartmentDropdown(departments);
});

// Trigger the 'change' event to populate the department dropdown with the departments for the initially selected company
const event = new Event('change');
companySelect.dispatchEvent(event);
}


private updateDepartmentDropdown(departments: string[]): void {
  const departmentSelect = document.getElementById('departmentSelect') as HTMLSelectElement;
  departmentSelect.innerHTML = ''; // Clear the current options

  // Add an "All Departments" option
  const allDepartmentsOption = document.createElement('option');
  allDepartmentsOption.value = 'All Departments';
  allDepartmentsOption.innerText = 'All Departments';
  departmentSelect.appendChild(allDepartmentsOption);

  departments.forEach(department => {
    const option = document.createElement('option');
    option.value = department;
    option.innerText = department;
    departmentSelect.appendChild(option);
  });
}

  private fetchAndRenderSuggestions(searchTerm: string): void {
    const InstantsearchInput = document.getElementById('InstantsearchInput') as HTMLInputElement;
    const suggestionsContainer = document.getElementById('col-12') as HTMLDivElement;
  
    if (InstantsearchInput) {
      console.log("search input:", InstantsearchInput.value);
      const trimmedSearchTerm = searchTerm.trim();
      console.log('Rendering suggestions for searchTerm:', trimmedSearchTerm);
  
      // Perform the logic to fetch and render suggestions based on the searchTerm
      let filteredSuggestions = this.getFilterBySearchTerm(trimmedSearchTerm, this.users);
      console.log('Filtered suggestions:', filteredSuggestions);
  
      // Filter the suggestions further based on the selected company and department
      const companySelect = document.getElementById('companySelect') as HTMLSelectElement;
      const departmentSelect = document.getElementById('departmentSelect') as HTMLSelectElement;
      const selectedCompany = companySelect.value;
      const selectedDepartment = departmentSelect.value;
  
      filteredSuggestions = filteredSuggestions.filter(user => {
        return (selectedCompany === 'All Companies' || user.Company === selectedCompany) &&
               (selectedDepartment === 'All Departments' || user.Department === selectedDepartment);
      });

      console.log('Selected company:', selectedCompany);
      console.log('Selected department:', selectedDepartment);
      console.log('Filtered suggestions:', filteredSuggestions);
  
      this.renderSuggestions(filteredSuggestions, suggestionsContainer);
    }
  }

  private getFilterBySearchTerm(searchTerm: string, usersList: any[]): any[] {
    if (typeof searchTerm !== 'string') {
      searchTerm = '';
    }

    if (!searchTerm.trim()) {
      // If no valid search term is provided, return the original array
      return usersList;
    }
  
    const searchableColumns = ['UserName', 'Email'];
    const searchTerms = searchTerm.toLowerCase().split(' '); // Split search term into individual words
    const filteredUsers = usersList.filter(user => {
      // Check if the search term is a substring of any user property in the searchable columns
      return searchableColumns.some(column =>{
        const propertyValue = user[column];

      // Check if the property value is not null or undefined before performing operations on it
      return (
        propertyValue &&
        typeof propertyValue === 'string' &&
        searchTerms.every(searchWord =>
          propertyValue.toLowerCase().includes(searchWord)
        )
      );
    });
  });
  
    return filteredUsers;
  }

  private renderSuggestions(suggestions: any[], container: HTMLDivElement): void {
    container.innerHTML = ''; // Clear previous suggestions
  
    if (suggestions.length > 0) {
      const suggestionList = document.createElement('div');
      suggestionList.id = 'suggestionList';
  
      suggestions.forEach((suggestion) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add(styles.ContentSection);
        const defaultimage = require('./assets/default-icon.png'); 
        const UserName = suggestion.UserName ?? 'Nil';
        const jobTitle = suggestion.JobTitle ?? 'Nil';
        const Profile = suggestion.ProfilePicture?.Url ?? defaultimage;
        const userEmail = suggestion.Email ?? 'default@email.com';
  
        suggestionItem.innerHTML = `
        <div class="${styles.UserDetails}">
          <div class="${styles.ImgBox}">
            <img src="${suggestion.ProfilePicture && suggestion.ProfilePicture.Url ? suggestion.ProfilePicture.Url : defaultimage}" alt="User Image" onerror="this.onerror=null;this.src='${defaultimage}';">
          </div>
          <div class="${styles.Contents}">
            <h6 class="mb-0">${UserName}</h6> 
            <span>${jobTitle}</span>
          </div>
        </div>
        <a href="msteams:/l/chat/0/0?users=${encodeURIComponent(userEmail)}&message=Hello%2C%20would%20you%20like%20to%20connect?" class="button">Chat</a>
        </div>`;
  
        suggestionList.appendChild(suggestionItem);
      });
  
      container.appendChild(suggestionList);
    } else {
      // If no suggestions, you can display a message or hide the container
      container.textContent = 'No suggestions found.';
    }
  }
}