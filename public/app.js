const state = {
  token: localStorage.getItem('cajaclara_token'),
  user: JSON.parse(localStorage.getItem('cajaclara_user') || 'null'),
  products: [],
  searchTimer: null
};

const elements = {
  authView: document.querySelector('#auth-view'),
  appView: document.querySelector('#app-view'),
  loginTab: document.querySelector('#login-tab'),
  registerTab: document.querySelector('#register-tab'),
  loginForm: document.querySelector('#login-form'),
  registerForm: document.querySelector('#register-form'),
  authTitle: document.querySelector('#auth-title'),
  authDescription: document.querySelector('#auth-description'),
  userName: document.querySelector('#user-name'),
  userEmail: document.querySelector('#user-email'),
  logoutButton: document.querySelector('#logout-button'),
  openProductModal: document.querySelector('#open-product-modal'),
  emptyAddButton: document.querySelector('#empty-add-button'),
  productDialog: document.querySelector('#product-dialog'),
  closeProductModal: document.querySelector('#close-product-modal'),
  cancelProduct: document.querySelector('#cancel-product'),
  productForm: document.querySelector('#product-form'),
  dialogTitle: document.querySelector('#dialog-title'),
  productTableBody: document.querySelector('#product-table-body'),
  loadingState: document.querySelector('#loading-state'),
  emptyState: document.querySelector('#empty-state'),
  resultCount: document.querySelector('#result-count'),
  searchProducts: document.querySelector('#search-products'),
  categoryFilter: document.querySelector('#category-filter'),
  metricActive: document.querySelector('#metric-active'),
  metricStock: document.querySelector('#metric-stock'),
  metricLowStock: document.querySelector('#metric-low-stock'),
  toast: document.querySelector('#toast')
};

function setAuthMode(mode) {
  const isLogin = mode === 'login';
  elements.loginTab.classList.toggle('is-active', isLogin);
  elements.registerTab.classList.toggle('is-active', !isLogin);
  elements.loginTab.setAttribute('aria-selected', String(isLogin));
  elements.registerTab.setAttribute('aria-selected', String(!isLogin));
  elements.loginForm.classList.toggle('is-hidden', !isLogin);
  elements.registerForm.classList.toggle('is-hidden', isLogin);
  elements.authTitle.textContent = isLogin ? 'Bienvenido de nuevo' : 'Crea tu espacio de trabajo';
  elements.authDescription.textContent = isLogin
    ? 'Ingresa para consultar y actualizar tu inventario.'
    : 'Registra una cuenta para empezar a organizar tus productos.';
  clearFormErrors();
}

function showApp() {
  elements.authView.classList.add('is-hidden');
  elements.appView.classList.remove('is-hidden');
  elements.userName.textContent = state.user?.name || 'Mi cuenta';
  elements.userEmail.textContent = state.user?.email || '';
}

function showAuth() {
  elements.appView.classList.add('is-hidden');
  elements.authView.classList.remove('is-hidden');
  setAuthMode('login');
}

function persistSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('cajaclara_token', token);
  localStorage.setItem('cajaclara_user', JSON.stringify(user));
}

function clearSession() {
  state.token = null;
  state.user = null;
  state.products = [];
  localStorage.removeItem('cajaclara_token');
  localStorage.removeItem('cajaclara_user');
}

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && state.token) {
    clearSession();
    showAuth();
  }

  if (!response.ok) {
    const validationMessage = payload.errors?.[0]?.message;
    throw new Error(validationMessage || payload.message || 'No fue posible completar la solicitud.');
  }

  return payload;
}

function setFormError(name, message = '') {
  const target = document.querySelector(`[data-error-for="${name}"]`);
  if (target) {
    target.textContent = message;
  }
}

function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach((element) => {
    element.textContent = '';
  });
}

function setPending(form, pending) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;

  if (!button.dataset.label) {
    button.dataset.label = button.textContent;
  }

  button.disabled = pending;
  button.textContent = pending ? 'Guardando...' : button.dataset.label;
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle('is-error', isError);
  elements.toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove('is-visible');
  }, 3200);
}

async function handleAuthSubmit(event, mode) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = Object.fromEntries(new FormData(form).entries());
  setFormError(mode);
  setPending(form, true);

  try {
    const payload = await apiRequest(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    persistSession(payload.data.token, payload.data.user);
    form.reset();
    showApp();
    await loadProducts();
    showToast(mode === 'login' ? 'Sesión iniciada.' : 'Tu cuenta quedó lista.');
  } catch (error) {
    setFormError(mode, error.message);
  } finally {
    setPending(form, false);
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
}

function createCell(text, className, label) {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  if (label) cell.dataset.label = label;
  return cell;
}

function renderProducts() {
  elements.productTableBody.replaceChildren();
  const products = state.products;

  elements.loadingState.classList.add('is-hidden');
  elements.emptyState.classList.toggle('is-hidden', products.length !== 0);
  elements.resultCount.textContent = products.length === 1
    ? '1 producto encontrado'
    : `${products.length} productos encontrados`;

  const activeProducts = products.filter((product) => product.status === 'active');
  elements.metricActive.textContent = activeProducts.length;
  elements.metricStock.textContent = products.reduce((sum, product) => sum + product.stock, 0);
  elements.metricLowStock.textContent = activeProducts.filter((product) => product.stock <= 5).length;

  products.forEach((product) => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.dataset.label = 'Producto';
    const nameWrap = document.createElement('span');
    const name = document.createElement('strong');
    const sku = document.createElement('small');
    nameWrap.className = 'product-name';
    name.textContent = product.name;
    sku.textContent = product.sku;
    nameWrap.append(name, sku);
    nameCell.append(nameWrap);
    row.append(nameCell);
    row.append(createCell(product.category, '', 'Categoría'));
    row.append(createCell(formatMoney(product.price), '', 'Precio'));
    row.append(createCell(`${product.stock} unid.`, product.stock <= 5 ? 'stock-low' : '', 'Existencia'));

    const statusCell = document.createElement('td');
    statusCell.dataset.label = 'Estado';
    const status = document.createElement('span');
    status.className = `status-pill ${product.status === 'archived' ? 'archived' : ''}`;
    status.textContent = product.status === 'archived' ? 'Archivado' : 'Activo';
    statusCell.append(status);
    row.append(statusCell);

    const actionsCell = document.createElement('td');
    actionsCell.dataset.label = 'Acciones';
    const actions = document.createElement('div');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');
    actions.className = 'row-actions';
    editButton.className = 'row-button';
    editButton.type = 'button';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => openProductDialog(product));
    deleteButton.className = 'row-button danger';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Eliminar';
    deleteButton.addEventListener('click', () => deleteProduct(product));
    actions.append(editButton, deleteButton);
    actionsCell.append(actions);
    row.append(actionsCell);

    elements.productTableBody.append(row);
  });
}

async function loadProducts() {
  elements.loadingState.classList.remove('is-hidden');
  elements.emptyState.classList.add('is-hidden');
  elements.productTableBody.replaceChildren();

  const params = new URLSearchParams({ limit: '100' });
  const search = elements.searchProducts.value.trim();
  const category = elements.categoryFilter.value;
  if (search) params.set('search', search);
  if (category) params.set('category', category);

  try {
    const payload = await apiRequest(`/api/products?${params}`);
    state.products = payload.data;
    renderProducts();
  } catch (error) {
    elements.loadingState.classList.add('is-hidden');
    elements.resultCount.textContent = 'No fue posible cargar el inventario';
    showToast(error.message, true);
  }
}

function openProductDialog(product = null) {
  clearFormErrors();
  elements.productForm.reset();
  elements.productForm.querySelector('button[type="submit"]').dataset.label = product
    ? 'Guardar cambios'
    : 'Guardar producto';
  elements.productForm.querySelector('button[type="submit"]').textContent = product
    ? 'Guardar cambios'
    : 'Guardar producto';
  elements.dialogTitle.textContent = product ? 'Editar producto' : 'Agregar producto';
  document.querySelector('#product-id').value = product?._id || '';

  if (product) {
    document.querySelector('#product-name').value = product.name;
    document.querySelector('#product-sku').value = product.sku;
    document.querySelector('#product-category').value = product.category;
    document.querySelector('#product-price').value = product.price;
    document.querySelector('#product-stock').value = product.stock;
    document.querySelector('#product-description').value = product.description || '';
    document.querySelector('#product-status').value = product.status;
  }

  elements.productDialog.showModal();
  document.querySelector('#product-name').focus();
}

function closeProductDialog() {
  if (elements.productDialog.open) {
    elements.productDialog.close();
  }
}

async function saveProduct(event) {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(elements.productForm).entries());
  const productId = formData.id;
  delete formData.id;
  formData.price = Number(formData.price);
  formData.stock = Number(formData.stock);
  setFormError('product');
  setPending(elements.productForm, true);

  try {
    const payload = await apiRequest(productId ? `/api/products/${productId}` : '/api/products', {
      method: productId ? 'PUT' : 'POST',
      body: JSON.stringify(formData)
    });
    closeProductDialog();
    await loadProducts();
    showToast(payload.message);
  } catch (error) {
    setFormError('product', error.message);
  } finally {
    setPending(elements.productForm, false);
  }
}

async function deleteProduct(product) {
  const confirmed = window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`);
  if (!confirmed) return;

  try {
    const payload = await apiRequest(`/api/products/${product._id}`, { method: 'DELETE' });
    await loadProducts();
    showToast(payload.message);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function restoreSession() {
  if (!state.token) {
    showAuth();
    return;
  }

  try {
    const payload = await apiRequest('/api/auth/me');
    state.user = payload.data.user;
    localStorage.setItem('cajaclara_user', JSON.stringify(state.user));
    showApp();
    await loadProducts();
  } catch (_error) {
    clearSession();
    showAuth();
  }
}

elements.loginTab.addEventListener('click', () => setAuthMode('login'));
elements.registerTab.addEventListener('click', () => setAuthMode('register'));
elements.loginForm.addEventListener('submit', (event) => handleAuthSubmit(event, 'login'));
elements.registerForm.addEventListener('submit', (event) => handleAuthSubmit(event, 'register'));
elements.logoutButton.addEventListener('click', () => {
  clearSession();
  showAuth();
  showToast('La sesión se cerró correctamente.');
});
elements.openProductModal.addEventListener('click', () => openProductDialog());
elements.emptyAddButton.addEventListener('click', () => openProductDialog());
elements.closeProductModal.addEventListener('click', closeProductDialog);
elements.cancelProduct.addEventListener('click', closeProductDialog);
elements.productForm.addEventListener('submit', saveProduct);
elements.productDialog.addEventListener('click', (event) => {
  if (event.target === elements.productDialog) closeProductDialog();
});
elements.searchProducts.addEventListener('input', () => {
  window.clearTimeout(state.searchTimer);
  state.searchTimer = window.setTimeout(loadProducts, 300);
});
elements.categoryFilter.addEventListener('change', loadProducts);

restoreSession();
