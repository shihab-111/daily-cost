export type AppLanguage = 'en' | 'bn';

export interface TranslationStrings {
  common: {
    english: string;
    bangla: string;
    languageLabel: string;
    verifyingWorkspace: string;
    signOut: string;
    exportCsv: string;
    all: string;
    today: string;
    last7Days: string;
    last7DShort: string;
    thisMonth: string;
    monthShort: string;
    allTime: string;
    custom: string;
    to: string;
    delete: string;
    no: string;
    edit: string;
    saving: string;
    actions: string;
    status: string;
    loading: string;
    download: string;
    close: string;
    noCaption: string;
    errorTitle: string;
    errorDesc: string;
    reloadApp: string;
  };
  nav: {
    overview: string;
    personalOverview: string;
    businessExpenses: string;
    dailyExpenses: string;
    productInventory: string;
    customersBd: string;
    partners: string;
    pathaoDelivery: string;
    personalLoans: string;
    receiptStudio: string;
    settingsData: string;
    settingsBudget: string;
    myProfile: string;
    activeMode: string;
    business: string;
    personal: string;
    workspaceOwner: string;
    adminPortal: string;
    openMenu: string;
  };
  login: {
    kicker: string;
    headlinePrefix: string;
    headlineHighlight: string;
    headlineSuffix: string;
    subtitle: string;
    highlight1Title: string;
    highlight1Desc: string;
    highlight2Title: string;
    highlight2Desc: string;
    highlight3Title: string;
    highlight3Desc: string;
    workspaceTag: string;
    signInTitle: string;
    registerTitle: string;
    authSubtitle: string;
    preparingWorkspace: string;
    checkingSession: string;
    connectingDb: string;
    verifyEmailTitle: string;
    verifyEmailDescPrefix: string;
    verifyEmailDescSuffix: string;
    checkingStatus: string;
    iveVerified: string;
    resendVerification: string;
    sendVerification: string;
    signOutSwitch: string;
    signInTab: string;
    createAccountTab: string;
    yourName: string;
    businessName: string;
    emailAddress: string;
    password: string;
    confirmPassword: string;
    passwordPlaceholderLogin: string;
    passwordPlaceholderRegister: string;
    reenterPassword: string;
    rememberSession: string;
    signingIn: string;
    creatingWorkspace: string;
    signInWithEmail: string;
    createPrivateAccount: string;
    checkSpamHint: string;
    verificationAutoDetect: string;
    verificationSentNotice: string;
    verificationNotYetNotice: string;
    verificationTooManyNotice: string;
    namePlaceholder: string;
    businessPlaceholder: string;
    emailPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    forgotPassword: string;
    sendingResetLink: string;
    resetEmailSentNotice: string;
    enterEmailForReset: string;
  };
  dashboard: {
    addProduct: string;
    logBusinessExpense: string;
    quickLogExpense: string;
    businessCsv: string;
    personalCsv: string;
    inventoryCsv: string;
    businessExpenses: string;
    loggedTransactions: string;
    marketingAdsSpend: string;
    ofPeriodExpenditure: string;
    inventoryCostValue: string;
    estRetail: string;
    totalUnitsStocked: string;
    skus: string;
    lowOutAlert: string;
    thisMonthSpending: string;
    entriesInRange: string;
    monthlyBudgetCap: string;
    remaining: string;
    overCap: string;
    cap: string;
    dailyAverageSpend: string;
    acrossDaysPrefix: string;
    acrossDaysSuffix: string;
    todaysSpendDhaka: string;
    periodTotal: string;
    pnlCardTitle: string;
    pnlCardDesc: string;
    totalInvestedLabel: string;
    partnersWord: string;
    partnerDueLabel: string;
    customerSalesLabel: string;
    customersWord: string;
    ordersWord: string;
    totalBusinessCostLabel: string;
    selectedPeriodLabel: string;
    netProfitLossLabel: string;
    profitBadge: string;
    lossBadge: string;
    breakEvenBadge: string;
    capitalBalanceLabel: string;
    roiLabel: string;
  };
  expenses: {
    logBusinessExpense: string;
    logDailyExpense: string;
    searchBusiness: string;
    searchPersonal: string;
    allBusiness: string;
    allPersonal: string;
    entries: string;
    total: string;
    noExpensesTitle: string;
    noBusinessEmpty: string;
    noPersonalEmpty: string;
    date: string;
    titleDetails: string;
    category: string;
    payment: string;
    receipt: string;
    amount: string;
    manageCategories: string;
    doneManaging: string;
    addCategoryPlaceholder: string;
    addCategoryBtn: string;
    restoreDefaults: string;
    deleteCategoryTitle: string;
    duplicateCategory: string;
    categoryPhoto: string;
    uploadPhoto: string;
    changePhoto: string;
    removePhoto: string;
    quantity: string;
    perPiecePrice: string;
    editCategory: string;
    saveCategory: string;
    cancelEdit: string;
  };
  products: {
    addProduct: string;
    addFirstProduct: string;
    searchPlaceholder: string;
    allCategories: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
    noProductsTitle: string;
    noProductsDesc: string;
    photo: string;
    productSku: string;
    cost: string;
    selling: string;
    stockLevel: string;
    photos: string;
  };
  customers: {
    addCustomer: string;
    addFirstCustomer: string;
    savedCustomers: string;
    recordedOrders: string;
    lifetimeValue: string;
    searchPlaceholder: string;
    showingOf: string;
    customersWord: string;
    noCustomersTitle: string;
    noCustomersDesc: string;
    customer: string;
    bdPhone: string;
    districtAddress: string;
    orders: string;
    totalSpent: string;
    receiptBtn: string;
    orderProductCol: string;
    numberOptionLabel: string;
    locationDistrictLabel: string;
    locationAddressLabel: string;
    orderSectionTitle: string;
    quickPickProduct: string;
    selectFromInventory: string;
    productNameLabel: string;
    productSizeLabel: string;
    quantityLabel: string;
    tkPerProductLabel: string;
    deliveryChargeLabel: string;
    deliveryChargeShort: string;
    orderTotalLabel: string;
    orderDetailsLabel: string;
    recordNewOrderLabel: string;
    sizeWord: string;
    perPcWord: string;
    sendToPathaoBtn: string;
    saveAndSendPathaoBtn: string;
    exportAllCsv: string;
    exportSelectedCsv: string;
    selectAllVisible: string;
    clearSelection: string;
    selectedCountWord: string;
    zoneLabel: string;
    areaLabel: string;
    itemTypeLabel: string;
    itemWeightLabel: string;
    storeNameLabel: string;
    merchantOrderIdLabel: string;
    parcelOption: string;
    documentOption: string;
    specialInstructionLabel: string;
    orderStatusLabel: string;
    filterAllOrders: string;
    statusPending: string;
    statusReceived: string;
    statusRejected: string;
    statusNoCall: string;
  };
  partners: {
    pageTitle: string;
    addPartners: string;
    addFirstPartner: string;
    exportCsv: string;
    totalPartners: string;
    totalInvested: string;
    totalDue: string;
    totalEquity: string;
    searchPlaceholder: string;
    filterAll: string;
    filterDue: string;
    filterSettled: string;
    showingOf: string;
    partnersWord: string;
    noPartnersTitle: string;
    noPartnersDesc: string;
    partnerCol: string;
    shareCol: string;
    investCol: string;
    dueCol: string;
    statusCol: string;
    partnerNameLabel: string;
    partnerPhoneLabel: string;
    investAmountLabel: string;
    dueAmountLabel: string;
    sharePercentLabel: string;
    currencyLabel: string;
    notesLabel: string;
    addAnotherRow: string;
    removeRow: string;
    clearDue: string;
    settledBadge: string;
    duePendingBadge: string;
    modalAddTitle: string;
    modalEditTitle: string;
    modalSubtitle: string;
    partnerRowPrefix: string;
    savePartner: string;
    saveAllPartners: string;
    updatePartner: string;
    batchTotalLabel: string;
  };
  loans: {
    pageTitle: string;
    addLoan: string;
    addFirstLoan: string;
    exportCsv: string;
    lentOutTitle: string;
    borrowedTitle: string;
    netPositionTitle: string;
    peopleTrackedTitle: string;
    peopleWord: string;
    personWord: string;
    entriesWord: string;
    principalWord: string;
    theyOweYou: string;
    youOweThem: string;
    balancedLabel: string;
    peopleSummaryTitle: string;
    allPeopleChip: string;
    searchPlaceholder: string;
    filterAll: string;
    filterGiven: string;
    filterTaken: string;
    filterPending: string;
    filterSettled: string;
    showingOf: string;
    loansWord: string;
    noLoansTitle: string;
    noLoansDesc: string;
    directionCol: string;
    personCol: string;
    dateCol: string;
    amountCol: string;
    paidCol: string;
    remainingCol: string;
    statusCol: string;
    givenBadge: string;
    takenBadge: string;
    settledBadge: string;
    pendingBadge: string;
    markSettled: string;
    addRepayment: string;
    repaymentPromptLabel: string;
    saveRepayment: string;
    modalAddTitle: string;
    modalEditTitle: string;
    modalSubtitle: string;
    directionLabel: string;
    directionGivenOption: string;
    directionTakenOption: string;
    personNameLabel: string;
    personNamePlaceholder: string;
    phoneLabel: string;
    loanAmountLabel: string;
    paidAmountLabel: string;
    currencyLabel: string;
    dateLabel: string;
    dueDateLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    addAnotherRow: string;
    removeRow: string;
    rowPrefix: string;
    saveLoan: string;
    saveAllLoans: string;
    updateLoan: string;
    batchTotalLabel: string;
    overviewCardTitle: string;
    overviewCardDesc: string;
    manageLoansBtn: string;
  };
  pathao: {
    pageTitle: string;
    newParcel: string;
    pickCustomerLabel: string;
    pickCustomerPlaceholder: string;
    exportBulkCsv: string;
    serverConnectedTitle: string;
    serverConnectedDesc: string;
    serverNotConfiguredTitle: string;
    serverNotConfiguredDesc: string;
    totalParcels: string;
    dispatchedCount: string;
    queuedCount: string;
    totalCodAmount: string;
    totalDeliveryFees: string;
    searchPlaceholder: string;
    filterAll: string;
    filterDispatched: string;
    filterQueued: string;
    showingOf: string;
    parcelsWord: string;
    noParcelsTitle: string;
    noParcelsDesc: string;
    consignmentCol: string;
    recipientCol: string;
    itemCol: string;
    codCol: string;
    feeCol: string;
    statusCol: string;
    sendNowBtn: string;
    sendingBtn: string;
    refreshBtn: string;
    refreshingBtn: string;
    queuedBadge: string;
    apiBadge: string;
    modalTitle: string;
    modalEditTitle: string;
    modalSubtitle: string;
    storeLabel: string;
    loadingStores: string;
    noStoreFallback: string;
    orderIdLabel: string;
    recipientNameLabel: string;
    recipientPhoneLabel: string;
    districtLabel: string;
    addressLabel: string;
    addressHint: string;
    deliveryTypeLabel: string;
    normalDelivery: string;
    onDemandDelivery: string;
    itemTypeLabel: string;
    parcelType: string;
    documentType: string;
    quantityLabel: string;
    weightLabel: string;
    codAmountLabel: string;
    itemDescLabel: string;
    instructionLabel: string;
    sendToPathaoSubmit: string;
    saveQueueDraftBtn: string;
    dispatchSuccessPrefix: string;
    queueSuccessMsg: string;
  };
  receipts: {
    newBlankReceipt: string;
    saveBrandStyle: string;
    downloadPdf: string;
    downloadPng: string;
    print: string;
    brandStyleTab: string;
    customerTab: string;
    itemsTotalsTab: string;
    livePreview: string;
    savedReceipts: string;
  };
  settings: {
    sectionTitle: string;
    sectionDesc: string;
    businessSectionTitle: string;
    businessSectionDesc: string;
    personalSectionTitle: string;
    personalSectionDesc: string;
    businessNameLabel: string;
    ownerNameLabel: string;
    defaultCurrencyLabel: string;
    usdRateLabel: string;
    monthlyBudgetLabel: string;
    lowStockLabel: string;
    bdPhoneLabel: string;
    addressLabel: string;
    businessAddressLabel: string;
    homeAddressLabel: string;
    saveSettings: string;
    saveBusinessSettings: string;
    savePersonalSettings: string;
    savedBusinessMsg: string;
    savedPersonalMsg: string;
    privacyTitle: string;
    privacyDesc: string;
    businessPrivacyDesc: string;
    personalPrivacyDesc: string;
    verifiedAccount: string;
    downloadBackups: string;
    allExpensesCsv: string;
    businessExpensesCsv: string;
    personalExpensesCsv: string;
    personalLoansCsv: string;
    inventoryCsv: string;
  };
  profile: {
    sectionTitle: string;
    sectionDesc: string;
    photoLabel: string;
    photoHint: string;
    uploadPhoto: string;
    changePhoto: string;
    removePhoto: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    emailLabel: string;
    emailReadOnlyHint: string;
    saveProfile: string;
    profileSaved: string;
    verifiedBadge: string;
    roleAdmin: string;
    roleOwner: string;
    passwordSectionTitle: string;
    passwordSectionDesc: string;
    currentPasswordLabel: string;
    currentPasswordPlaceholder: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    passwordHint: string;
    updatePassword: string;
    updatingPassword: string;
    passwordUpdated: string;
    providerNoPassword: string;
    manageProfileBtn: string;
    invalidImageFile: string;
  };
  business: {
    yourBusinessName: string;
    activeBusinessLabel: string;
    addBusiness: string;
    addNewBusiness: string;
    switchBusiness: string;
    businessPlaceholder: string;
    manageBusinesses: string;
    manageBusinessesDesc: string;
    primaryBusiness: string;
    rename: string;
    saveName: string;
    cannotDeletePrimary: string;
    duplicateBusiness: string;
    confirmDeleteBusiness: string;
  };
  admin: {
    portalTitle: string;
    portalSubtitle: string;
    directLinkLabel: string;
    copyLink: string;
    linkCopied: string;
    exportUsersCsv: string;
    totalUsers: string;
    loggedInToday: string;
    totalLogins: string;
    totalBusinesses: string;
    searchPlaceholder: string;
    filterAll: string;
    filterToday: string;
    filterLast7Days: string;
    filterPending: string;
    sortLatestLogin: string;
    sortMostLogins: string;
    sortNameAsc: string;
    sortFirstSeen: string;
    userColumn: string;
    emailColumn: string;
    businessesColumn: string;
    lastLoginColumn: string;
    firstSeenColumn: string;
    loginCountColumn: string;
    pendingNextLogin: string;
    justNow: string;
    noUsersTitle: string;
    noUsersDesc: string;
    showingCount: string;
    usersWord: string;
    accessDeniedTitle: string;
    accessDeniedDesc: string;
    backToDashboard: string;
    adminBadge: string;
  };
  authErrors: {
    initFailed: string;
    permissionDenied: string;
    operationNotAllowed: string;
    emailInUse: string;
    invalidEmail: string;
    weakPassword: string;
    tooManyRequests: string;
    invalidCredential: string;
    signInFailed: string;
    registerFailed: string;
    sendVerificationFailed: string;
    checkVerificationFailed: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationStrings> = {
  en: {
    common: {
      english: 'EN',
      bangla: 'বাংলা',
      languageLabel: 'Website language',
      verifyingWorkspace: 'Verifying private workspace...',
      signOut: 'Sign Out',
      exportCsv: 'Export CSV',
      all: 'All',
      today: 'Today',
      last7Days: 'Last 7 Days',
      last7DShort: '7D',
      thisMonth: 'This Month',
      monthShort: 'Month',
      allTime: 'All Time',
      custom: 'Custom',
      to: 'to',
      delete: 'Delete',
      no: 'No',
      edit: 'Edit',
      saving: 'Saving...',
      actions: 'Actions',
      status: 'Status',
      loading: 'Loading...',
      download: 'Download',
      close: 'Close',
      noCaption: 'No caption provided',
      errorTitle: 'Something went wrong',
      errorDesc: 'An unexpected error occurred while rendering this view. Reload to recover.',
      reloadApp: 'Reload Application',
    },
    nav: {
      overview: 'Overview',
      personalOverview: 'Personal Overview',
      businessExpenses: 'Business Expenses',
      dailyExpenses: 'Daily Expenses',
      productInventory: 'Product Inventory',
      customersBd: 'Customer (Order)',
      partners: 'Partners & Invest',
      pathaoDelivery: 'Pathao Delivery',
      personalLoans: 'Loans (Given & Taken)',
      receiptStudio: 'Receipt Studio',
      settingsData: 'Settings & Data',
      settingsBudget: 'Settings & Budget',
      myProfile: 'My Profile',
      activeMode: 'Active Mode',
      business: 'Business',
      personal: 'Personal',
      workspaceOwner: 'Workspace Owner',
      adminPortal: 'Admin Portal',
      openMenu: 'All Pages / Menu',
    },
    login: {
      kicker: 'EkTally · Dual-Mode Business & Personal Ledger',
      headlinePrefix: 'Private',
      headlineHighlight: 'business & personal',
      headlineSuffix: 'expense control.',
      subtitle:
        'Switch seamlessly between Business Operations (Meta ads, inventory, customers, custom receipts) and Personal Daily Expenses (bazaar, bills, monthly budget) with strict per-user data isolation.',
      highlight1Title: 'Dual Workspace',
      highlight1Desc: 'Business ops & personal daily ledger in one toggle',
      highlight2Title: 'BD Ready',
      highlight2Desc: 'BDT ৳, bKash, Nagad, Rocket & A4/80mm receipts',
      highlight3Title: 'UID Isolated',
      highlight3Desc: 'Scoped strictly to your verified account',
      workspaceTag: 'EkTally Workspace',
      signInTitle: 'Sign In to Your Ledger',
      registerTitle: 'Create Private Workspace',
      authSubtitle:
        'Your receipts, inventory, customers, and personal budgets remain strictly private to your verified account.',
      preparingWorkspace: 'Preparing your isolated workspace...',
      checkingSession: 'Checking session...',
      connectingDb: 'Connecting to secured database',
      verifyEmailTitle: 'Verify Your Email Address',
      verifyEmailDescPrefix: 'A verification link was sent to',
      verifyEmailDescSuffix:
        'Email verification is enforced by database security rules before private workspace access opens.',
      checkingStatus: 'Checking status...',
      iveVerified: "I've Verified — Open Workspace",
      resendVerification: 'Resend Verification Email',
      sendVerification: 'Send Verification Email',
      signOutSwitch: 'Sign Out & Switch Account',
      signInTab: 'Sign In',
      createAccountTab: 'Create Account',
      yourName: 'Your Name *',
      businessName: 'Business Name *',
      emailAddress: 'Email Address *',
      password: 'Password *',
      confirmPassword: 'Confirm Password *',
      passwordPlaceholderLogin: 'Enter password',
      passwordPlaceholderRegister: 'Minimum 6 characters',
      reenterPassword: 'Re-enter password',
      rememberSession: 'Remember my session on this device',
      signingIn: 'Signing in...',
      creatingWorkspace: 'Creating workspace...',
      signInWithEmail: 'Sign In with Email',
      createPrivateAccount: 'Create Private Account',
      checkSpamHint: 'Check both your Inbox and Spam/Junk folder for the verification link.',
      verificationAutoDetect: 'Checking automatically every few seconds once you click the link.',
      verificationSentNotice: 'Verification link sent. Open your inbox or spam folder, confirm, then click "I\'ve Verified".',
      verificationNotYetNotice: 'Email is not verified yet. Please click the verification link in your inbox or spam folder first.',
      verificationTooManyNotice: 'Too many verification emails sent recently. Please check your inbox/spam or wait 1 minute.',
      namePlaceholder: 'e.g., Tanvir Ahmed',
      businessPlaceholder: 'e.g., Dhakaiya Attire',
      emailPlaceholder: 'you@business.com',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      forgotPassword: 'Forgot password?',
      sendingResetLink: 'Sending reset link...',
      resetEmailSentNotice: 'Password reset link sent to your email. Check your Inbox or Spam folder to set a new password.',
      enterEmailForReset: 'Enter your account email address above first, then click "Forgot password?".',
    },
    dashboard: {
      addProduct: 'Add Product',
      logBusinessExpense: 'Log Business Expense',
      quickLogExpense: 'Quick Log Expense',
      businessCsv: 'Business CSV',
      personalCsv: 'Personal CSV',
      inventoryCsv: 'Inventory CSV',
      businessExpenses: 'Business Expenses',
      loggedTransactions: 'logged transactions',
      marketingAdsSpend: 'Marketing & Ads Spend',
      ofPeriodExpenditure: '% of period expenditure',
      inventoryCostValue: 'Inventory Cost Value',
      estRetail: 'Est. Retail',
      totalUnitsStocked: 'Total Units Stocked',
      skus: 'SKUs',
      lowOutAlert: 'low/out alert',
      thisMonthSpending: 'This Month Spending',
      entriesInRange: 'entries in selected range',
      monthlyBudgetCap: 'Monthly Budget Cap',
      remaining: 'Remaining',
      overCap: 'Over cap',
      cap: 'Cap',
      dailyAverageSpend: 'Daily Average Spend',
      acrossDaysPrefix: 'Across',
      acrossDaysSuffix: 'days this month',
      todaysSpendDhaka: "Today's Spend (Dhaka)",
      periodTotal: 'Period total',
      pnlCardTitle: 'Business Profit, Loss & Investment Summary',
      pnlCardDesc:
        'Live calculation from Partners & Invest, Business Expenses (costs), and Customers (sales revenue).',
      totalInvestedLabel: 'Total Invested (Partners)',
      partnersWord: 'partners',
      partnerDueLabel: 'Due',
      customerSalesLabel: 'Customer Sales (Revenue)',
      customersWord: 'customers',
      ordersWord: 'orders',
      totalBusinessCostLabel: 'Total Cost (Business Expenses)',
      selectedPeriodLabel: 'Selected period',
      netProfitLossLabel: 'Net Profit / Loss',
      profitBadge: 'PROFIT',
      lossBadge: 'LOSS',
      breakEvenBadge: 'BREAK-EVEN',
      capitalBalanceLabel: 'Capital Balance (Invest + Sales − Cost)',
      roiLabel: 'ROI on Invest',
    },
    expenses: {
      logBusinessExpense: 'Log Business Expense',
      logDailyExpense: 'Log Daily Expense',
      searchBusiness: 'Search ads, models, couriers, suppliers, or bKash/Nagad...',
      searchPersonal: 'Search bazaar, bills, CNG/Uber, shopping, or bKash/Nagad...',
      allBusiness: 'All Business',
      allPersonal: 'All Personal',
      entries: 'entries',
      total: 'Total',
      noExpensesTitle: 'No Expenses Found',
      noBusinessEmpty: 'Log Meta ads, photoshoot costs, packaging, or courier expenses.',
      noPersonalEmpty: 'Log groceries/bazaar, bills, transport, or daily personal expenses.',
      date: 'Date',
      titleDetails: 'Title & Details',
      category: 'Category',
      payment: 'Payment',
      receipt: 'Receipt',
      amount: 'Amount',
      manageCategories: 'Add / Delete Categories',
      doneManaging: 'Done',
      addCategoryPlaceholder: 'New category name...',
      addCategoryBtn: 'Add',
      restoreDefaults: 'Restore Defaults',
      deleteCategoryTitle: 'Delete category',
      duplicateCategory: 'This category already exists in the current mode.',
      categoryPhoto: 'Photo',
      uploadPhoto: 'Add Photo',
      changePhoto: 'Change Photo',
      removePhoto: 'Remove Photo',
      quantity: 'Quantity',
      perPiecePrice: 'Per Pics Price',
      editCategory: 'Edit category',
      saveCategory: 'Save',
      cancelEdit: 'Cancel',
    },
    products: {
      addProduct: 'Add Product',
      addFirstProduct: 'Add First Product',
      searchPlaceholder: 'Search SKU, product name, fabric, or notes...',
      allCategories: 'All Categories',
      inStock: 'In Stock',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      noProductsTitle: 'No Products in Inventory',
      noProductsDesc:
        'Add SKUs with purchase cost, selling price, stock units, and multi-photo galleries.',
      photo: 'Photo',
      productSku: 'Product & SKU',
      cost: 'Cost',
      selling: 'Selling',
      stockLevel: 'Stock Level',
      photos: 'photos',
    },
    customers: {
      addCustomer: 'Add Customer',
      addFirstCustomer: 'Add First Customer',
      savedCustomers: 'Saved BD Customers',
      recordedOrders: 'Recorded Customer Orders',
      lifetimeValue: 'Lifetime Customer Value',
      searchPlaceholder: 'Search customer, +880 phone, location, product, or order details...',
      showingOf: 'Showing',
      customersWord: 'customers',
      noCustomersTitle: 'No Customers Saved Yet',
      noCustomersDesc:
        'Save customer contact, location, number option, product, size & price details for quick tracking and receipts.',
      customer: 'Customer',
      bdPhone: 'Phone & Option',
      districtAddress: 'Location',
      orders: 'Orders',
      totalSpent: 'Total Spent',
      receiptBtn: 'Receipt',
      orderProductCol: 'Order & Product Details',
      numberOptionLabel: 'Which Number Option',
      locationDistrictLabel: 'Location (District)',
      locationAddressLabel: 'Full Delivery Location / Address',
      orderSectionTitle: 'Order & Product Details',
      quickPickProduct: 'Pick from Inventory (Optional)',
      selectFromInventory: 'Select a saved product to auto-fill...',
      productNameLabel: 'Product Name',
      productSizeLabel: 'Size of Product',
      quantityLabel: 'Qty (Pcs)',
      tkPerProductLabel: 'Tk per Product (৳)',
      deliveryChargeLabel: 'Delivery Charge (৳)',
      deliveryChargeShort: 'Delivery',
      orderTotalLabel: 'Order Total',
      orderDetailsLabel: 'Order Details / Instructions',
      recordNewOrderLabel: 'Add as a new order (+1 order & add total to customer spent)',
      sizeWord: 'Size',
      perPcWord: 'per product',
      sendToPathaoBtn: 'Pathao',
      saveAndSendPathaoBtn: 'Save & Send to Pathao',
      exportAllCsv: 'Export All CSV',
      exportSelectedCsv: 'Export Selected CSV',
      selectAllVisible: 'Select All',
      clearSelection: 'Clear',
      selectedCountWord: 'selected',
      zoneLabel: 'Recipient Zone *',
      areaLabel: 'Recipient Area (Optional)',
      itemTypeLabel: 'Item Type',
      itemWeightLabel: 'Item Weight (kg)',
      storeNameLabel: 'Store Name (Optional)',
      merchantOrderIdLabel: 'Merchant Order ID (Optional)',
      parcelOption: 'parcel',
      documentOption: 'document',
      specialInstructionLabel: 'Special Instruction / Notes',
      orderStatusLabel: 'Order Category / Status',
      filterAllOrders: 'All Orders',
      statusPending: 'Pending',
      statusReceived: 'Order Received',
      statusRejected: 'Rejected / Not Received',
      statusNoCall: 'Not Received Call',
    },
    partners: {
      pageTitle: 'Business Partners & Investment',
      addPartners: 'Add Partner(s)',
      addFirstPartner: 'Add First Partner',
      exportCsv: 'Partners CSV',
      totalPartners: 'Business Partners',
      totalInvested: 'Total Invested',
      totalDue: 'Total Due Balance',
      totalEquity: 'Allocated Share %',
      searchPlaceholder: 'Search partner name, phone, or notes...',
      filterAll: 'All Partners',
      filterDue: 'Due Pending',
      filterSettled: 'Settled',
      showingOf: 'Showing',
      partnersWord: 'partners',
      noPartnersTitle: 'No Business Partners Added Yet',
      noPartnersDesc:
        'Add one or multiple business partners with their invested capital, pending due amount, and optional share %.',
      partnerCol: 'Partner',
      shareCol: 'Share %',
      investCol: 'Invested',
      dueCol: 'Due',
      statusCol: 'Status',
      partnerNameLabel: 'Partner Name *',
      partnerPhoneLabel: 'Phone (Optional)',
      investAmountLabel: 'Invested Amount',
      dueAmountLabel: 'Due Amount',
      sharePercentLabel: 'Share % (Optional)',
      currencyLabel: 'Currency',
      notesLabel: 'Notes / Terms',
      addAnotherRow: 'Add Another Partner',
      removeRow: 'Remove',
      clearDue: 'Clear Due',
      settledBadge: 'Settled',
      duePendingBadge: 'Due Pending',
      modalAddTitle: 'Add Business Partners',
      modalEditTitle: 'Edit Business Partner',
      modalSubtitle:
        'Add one or multiple partners with their investment, due amount, and optional share %.',
      partnerRowPrefix: 'Partner',
      savePartner: 'Save Partner',
      saveAllPartners: 'Save Partners',
      updatePartner: 'Update Partner',
      batchTotalLabel: 'Batch Total',
    },
    loans: {
      pageTitle: 'Personal Loans (Given & Taken)',
      addLoan: 'Add Loan Entry',
      addFirstLoan: 'Add First Loan',
      exportCsv: 'Loans CSV',
      lentOutTitle: 'Loan Given (They Owe Me)',
      borrowedTitle: 'Loan Taken (I Owe Others)',
      netPositionTitle: 'Net Loan Balance',
      peopleTrackedTitle: 'Total People Tracked',
      peopleWord: 'people',
      personWord: 'person',
      entriesWord: 'entries',
      principalWord: 'Total lent/borrowed',
      theyOweYou: 'Net receivable to you',
      youOweThem: 'Net payable by you',
      balancedLabel: 'All balanced',
      peopleSummaryTitle: 'Breakdown by Person Name',
      allPeopleChip: 'All People',
      searchPlaceholder: 'Search by person name, phone, or notes...',
      filterAll: 'All',
      filterGiven: 'Loan Given',
      filterTaken: 'Loan Taken',
      filterPending: 'Pending',
      filterSettled: 'Settled',
      showingOf: 'Showing',
      loansWord: 'loans',
      noLoansTitle: 'No Personal Loans Recorded Yet',
      noLoansDesc:
        'Add people by name to track how many people took loans from you and how much Tk you borrowed from others.',
      directionCol: 'Type',
      personCol: 'Person Name',
      dateCol: 'Date',
      amountCol: 'Loan Tk',
      paidCol: 'Repaid',
      remainingCol: 'Remaining',
      statusCol: 'Status',
      givenBadge: 'Given (Receivable)',
      takenBadge: 'Taken (Payable)',
      settledBadge: 'Settled',
      pendingBadge: 'Pending',
      markSettled: 'Mark Settled',
      addRepayment: 'Repay',
      repaymentPromptLabel: 'Add Tk paid',
      saveRepayment: 'Apply',
      modalAddTitle: 'Add Personal Loan(s)',
      modalEditTitle: 'Edit Personal Loan',
      modalSubtitle:
        'Record money someone loaned from you or money you loaned from someone else, added by name.',
      directionLabel: 'Loan Type *',
      directionGivenOption: 'Person Loaned From Me (I Gave)',
      directionTakenOption: 'I Loaned From Person (I Borrowed)',
      personNameLabel: 'Person Name *',
      personNamePlaceholder: 'e.g., Karim Mia',
      phoneLabel: 'Phone (Optional)',
      loanAmountLabel: 'Loan Amount (Tk) *',
      paidAmountLabel: 'Already Repaid (Tk)',
      currencyLabel: 'Currency',
      dateLabel: 'Loan Date *',
      dueDateLabel: 'Return Date (Optional)',
      notesLabel: 'Notes / Reason',
      notesPlaceholder: 'Hand loan, bKash TrxID, or return promise...',
      addAnotherRow: 'Add Another Person',
      removeRow: 'Remove',
      rowPrefix: 'Person',
      saveLoan: 'Save Loan',
      saveAllLoans: 'Save Loans',
      updateLoan: 'Update Loan',
      batchTotalLabel: 'Batch Total',
      overviewCardTitle: 'Personal Loans (Given & Taken)',
      overviewCardDesc: 'Track who owes you and who you owe by name.',
      manageLoansBtn: 'Manage Loans',
    },
    pathao: {
      pageTitle: 'Pathao Courier Delivery',
      newParcel: 'New Pathao Parcel',
      pickCustomerLabel: 'Quick-Send Saved Customer',
      pickCustomerPlaceholder: 'Pick a customer from Customer (Order)...',
      exportBulkCsv: 'Pathao Bulk CSV',
      serverConnectedTitle: 'Pathao Courier API Connected',
      serverConnectedDesc:
        'Live parcel booking and consignment tracking are enabled via your server environment.',
      serverNotConfiguredTitle: 'Pathao API Keys Not Set on Server Yet',
      serverNotConfiguredDesc:
        'Set PATHAO_BASE_URL (https://api-hermes.pathao.com or sandbox URL), PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, PATHAO_PASSWORD & PATHAO_DEFAULT_STORE_ID (or PATHAO_MERCHANTS_JSON per user/business) in your server .env to send parcels live. You can still queue drafts and export Pathao Bulk CSV anytime.',
      totalParcels: 'Total Parcels',
      dispatchedCount: 'Sent to Pathao',
      queuedCount: 'Queued Drafts',
      totalCodAmount: 'Total COD Amount',
      totalDeliveryFees: 'Delivery Fees',
      searchPlaceholder: 'Search customer, phone, consignment ID, order ID, or address...',
      filterAll: 'All',
      filterDispatched: 'Sent to Pathao',
      filterQueued: 'Queued Drafts',
      showingOf: 'Showing',
      parcelsWord: 'parcels',
      noParcelsTitle: 'No Pathao Parcels Yet',
      noParcelsDesc:
        'Add a customer in Customer (Order) and click "Save & Send to Pathao" or pick a customer above to dispatch directly.',
      consignmentCol: 'Order & Consignment',
      recipientCol: 'Customer & Address',
      itemCol: 'Parcel Details',
      codCol: 'COD (Tk)',
      feeCol: 'Fee',
      statusCol: 'Status',
      sendNowBtn: 'Send Now',
      sendingBtn: 'Sending...',
      refreshBtn: 'Track',
      refreshingBtn: 'Checking...',
      queuedBadge: 'Queued Draft',
      apiBadge: 'Pathao Live',
      modalTitle: 'Send Order to Pathao Courier',
      modalEditTitle: 'Edit / Dispatch Pathao Parcel',
      modalSubtitle:
        'Customer details & order total are pre-filled. Review and send directly to Pathao Courier or save to queue.',
      storeLabel: 'Pickup Store *',
      loadingStores: 'Loading Pathao stores...',
      noStoreFallback: 'Default Server Store',
      orderIdLabel: 'Merchant Order ID *',
      recipientNameLabel: 'Customer Name *',
      recipientPhoneLabel: 'Customer Phone (11-digit BD) *',
      districtLabel: 'District / City',
      addressLabel: 'Full Delivery Address *',
      addressHint: 'Include House, Road, Area/Thana & District (min 10 chars) for Pathao auto-routing.',
      deliveryTypeLabel: 'Delivery Speed',
      normalDelivery: 'Normal Delivery (48h)',
      onDemandDelivery: 'On Demand / Express (12h)',
      itemTypeLabel: 'Item Type',
      parcelType: 'Parcel',
      documentType: 'Document',
      quantityLabel: 'Quantity (Pcs) *',
      weightLabel: 'Weight (kg) *',
      codAmountLabel: 'Cash on Delivery (৳ COD) *',
      itemDescLabel: 'Product / Item Description',
      instructionLabel: 'Special Instructions (Courier Note)',
      sendToPathaoSubmit: 'Send to Pathao Now',
      saveQueueDraftBtn: 'Save to Pathao Queue',
      dispatchSuccessPrefix: 'Sent to Pathao! Consignment ID:',
      queueSuccessMsg: 'Saved to Pathao Queue. Ready to Send Now or export Bulk CSV.',
    },
    receipts: {
      newBlankReceipt: 'New Blank Receipt',
      saveBrandStyle: 'Save Brand Style',
      downloadPdf: 'Download PDF',
      downloadPng: 'Download PNG',
      print: 'Print',
      brandStyleTab: 'Brand & Style',
      customerTab: 'Customer & Delivery',
      itemsTotalsTab: 'Items & Totals',
      livePreview: 'Live Preview',
      savedReceipts: 'Saved Receipts',
    },
    settings: {
      sectionTitle: 'Bangladesh Workspace, Currency & Personal Budget Settings',
      sectionDesc:
        'Configure your business profile, BDT/USD conversion, low-stock threshold, and monthly personal budget cap.',
      businessSectionTitle: 'Business Workspace, Currency & Inventory Settings',
      businessSectionDesc:
        'Configure your business profile, BDT/USD conversion rate, and low-stock alert threshold.',
      personalSectionTitle: 'Personal Budget & Currency Settings',
      personalSectionDesc:
        'Configure your monthly personal spending cap, default currency, and contact details.',
      businessNameLabel: 'Business / Brand Name *',
      ownerNameLabel: 'Account Owner Name *',
      defaultCurrencyLabel: 'Default Currency',
      usdRateLabel: 'USD to BDT Conversion Rate',
      monthlyBudgetLabel: 'Personal Monthly Budget Cap (৳ BDT)',
      lowStockLabel: 'Default Low-Stock Alert Threshold',
      bdPhoneLabel: 'BD Contact Phone (+8801XXXXXXXXX)',
      addressLabel: 'Office / Home Address',
      businessAddressLabel: 'Business / Office Address',
      homeAddressLabel: 'Home Address',
      saveSettings: 'Save Workspace Settings',
      saveBusinessSettings: 'Save Business Settings',
      savePersonalSettings: 'Save Personal Settings',
      savedBusinessMsg: 'Business workspace settings saved.',
      savedPersonalMsg: 'Personal budget settings saved.',
      privacyTitle: 'Multi-Tenant Privacy & Data Export',
      privacyDesc:
        'All expenses, inventory SKUs, customers, receipts, and uploaded photos are strictly isolated to your User UID.',
      businessPrivacyDesc:
        'All business expenses, inventory SKUs, customers, partners, and receipts are strictly isolated to your User UID.',
      personalPrivacyDesc:
        'All personal daily expenses and personal loans are strictly isolated to your User UID.',
      verifiedAccount: 'Verified Account',
      downloadBackups: 'Download Private Ledger Backups',
      allExpensesCsv: 'All Expenses CSV',
      businessExpensesCsv: 'Business Expenses CSV',
      personalExpensesCsv: 'Personal Expenses CSV',
      personalLoansCsv: 'Personal Loans CSV',
      inventoryCsv: 'Inventory CSV',
    },
    profile: {
      sectionTitle: 'My Profile',
      sectionDesc: 'Manage your profile photo, display name, and verified account details.',
      photoLabel: 'Profile Photo',
      photoHint: 'JPEG, PNG, or WebP · Automatically cropped and optimized',
      uploadPhoto: 'Upload Photo',
      changePhoto: 'Change Photo',
      removePhoto: 'Remove Photo',
      displayNameLabel: 'Full Name *',
      displayNamePlaceholder: 'e.g., Tanvir Ahmed',
      emailLabel: 'Account Email',
      emailReadOnlyHint: 'Verified sign-in email cannot be edited directly.',
      saveProfile: 'Save Profile',
      profileSaved: 'Profile photo and name updated successfully.',
      verifiedBadge: 'Email Verified',
      roleAdmin: 'Administrator',
      roleOwner: 'Workspace Owner',
      passwordSectionTitle: 'Change Password',
      passwordSectionDesc: 'Verify your current password to set a new account password.',
      currentPasswordLabel: 'Current Password *',
      currentPasswordPlaceholder: 'Enter your current password',
      newPasswordLabel: 'New Password *',
      newPasswordPlaceholder: 'Minimum 6 characters',
      confirmPasswordLabel: 'Confirm New Password *',
      confirmPasswordPlaceholder: 'Re-enter new password',
      passwordHint: 'Use at least 6 characters that differ from your current password.',
      updatePassword: 'Update Password',
      updatingPassword: 'Updating Password...',
      passwordUpdated: 'Your password has been updated.',
      providerNoPassword: 'Password change is unavailable for this sign-in provider.',
      manageProfileBtn: 'Manage Profile & Password',
      invalidImageFile: 'Please choose a valid JPEG, PNG, or WebP image file.',
    },
    business: {
      yourBusinessName: 'Add your business name',
      activeBusinessLabel: 'Active Business',
      addBusiness: 'Add Business',
      addNewBusiness: 'Add New Business',
      switchBusiness: 'Switch Business',
      businessPlaceholder: 'e.g., Dhakaiya Attire',
      manageBusinesses: 'Your Businesses',
      manageBusinessesDesc:
        'Create and switch between separate businesses. Each business keeps its own expenses, inventory, customers, and receipts.',
      primaryBusiness: 'Primary',
      rename: 'Rename',
      saveName: 'Save',
      cannotDeletePrimary: 'Primary business cannot be deleted (you can rename it).',
      duplicateBusiness: 'A business with this name already exists.',
      confirmDeleteBusiness: 'Delete?',
    },
    admin: {
      portalTitle: 'Admin User & Login Monitor',
      portalSubtitle: 'Real-time directory of verified accounts, businesses, and login timestamps (Asia/Dhaka).',
      directLinkLabel: 'Direct Admin Link',
      copyLink: 'Copy /admin Link',
      linkCopied: 'Link Copied',
      exportUsersCsv: 'Export Users CSV',
      totalUsers: 'Total Users',
      loggedInToday: 'Active Today (Dhaka)',
      totalLogins: 'Total Recorded Logins',
      totalBusinesses: 'Businesses Created',
      searchPlaceholder: 'Search by user name, email, business name, or UID...',
      filterAll: 'All Users',
      filterToday: 'Today',
      filterLast7Days: 'Last 7 Days',
      filterPending: 'Awaiting Next Login',
      sortLatestLogin: 'Latest Login',
      sortMostLogins: 'Most Logins',
      sortNameAsc: 'Name (A-Z)',
      sortFirstSeen: 'Newest Account',
      userColumn: 'User',
      emailColumn: 'Email Address',
      businessesColumn: 'Businesses',
      lastLoginColumn: 'Last Login Time',
      firstSeenColumn: 'First Seen / Created',
      loginCountColumn: 'Logins',
      pendingNextLogin: 'Awaiting next sign-in',
      justNow: 'Just now',
      noUsersTitle: 'No Matching Users',
      noUsersDesc: 'Try clearing the search query or switching the activity filter.',
      showingCount: 'Showing',
      usersWord: 'users',
      accessDeniedTitle: 'Admin Access Required',
      accessDeniedDesc: 'This portal (/admin) is restricted to authorized administrators. Sign in with an admin account to view user counts and login timestamps.',
      backToDashboard: 'Back to Dashboard',
      adminBadge: 'ADMIN',
    },
    authErrors: {
      initFailed: 'Unable to initialize your private workspace.',
      permissionDenied: 'Permission denied by database rules. Verify your email or try signing in again.',
      operationNotAllowed: 'Email/Password sign-in is not enabled in Firebase Authentication.',
      emailInUse: 'An account with this email already exists. Try signing in instead.',
      invalidEmail: 'Enter a valid email address.',
      weakPassword: 'Password must be at least 6 characters.',
      tooManyRequests: 'Too many attempts. Please wait a minute and try again.',
      invalidCredential: 'Invalid email or password.',
      signInFailed: 'Unable to sign in. Check your email and password.',
      registerFailed: 'Unable to create your account. Please try again.',
      sendVerificationFailed: 'Unable to send verification email right now.',
      checkVerificationFailed: 'Unable to check verification status right now.',
    },
  },
  bn: {
    common: {
      english: 'EN',
      bangla: 'বাংলা',
      languageLabel: 'ওয়েবসাইটের ভাষা',
      verifyingWorkspace: 'প্রাইভেট ওয়ার্কস্পেস যাচাই করা হচ্ছে...',
      signOut: 'সাইন আউট',
      exportCsv: 'CSV ডাউনলোড',
      all: 'সব',
      today: 'আজ',
      last7Days: 'গত ৭ দিন',
      last7DShort: '৭ দিন',
      thisMonth: 'এই মাস',
      monthShort: 'মাস',
      allTime: 'সব সময়',
      custom: 'কাস্টম',
      to: 'থেকে',
      delete: 'মুছুন',
      no: 'না',
      edit: 'সম্পাদনা',
      saving: 'সংরক্ষণ হচ্ছে...',
      actions: 'অ্যাকশন',
      status: 'অবস্থা',
      loading: 'লোড হচ্ছে...',
      download: 'ডাউনলোড',
      close: 'বন্ধ করুন',
      noCaption: 'কোনো ক্যাপশন নেই',
      errorTitle: 'একটি সমস্যা হয়েছে',
      errorDesc: 'পৃষ্ঠাটি লোড করতে গিয়ে একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। পুনরায় লোড করুন।',
      reloadApp: 'অ্যাপ পুনরায় লোড করুন',
    },
    nav: {
      overview: 'ওভারভিউ',
      personalOverview: 'ব্যক্তিগত ওভারভিউ',
      businessExpenses: 'ব্যবসায়িক খরচ',
      dailyExpenses: 'দৈনন্দিন খরচ',
      productInventory: 'পণ্য ও স্টক',
      customersBd: 'কাস্টমার (অর্ডার)',
      partners: 'পার্টনার ও বিনিয়োগ',
      pathaoDelivery: 'পাঠাও ডেলিভারি',
      personalLoans: 'ধার ও লোন হিসাব',
      receiptStudio: 'রসিদ / মেমো স্টুডিও',
      settingsData: 'সেটিংস ও ডেটা',
      settingsBudget: 'সেটিংস ও বাজেট',
      myProfile: 'আমার প্রোফাইল',
      activeMode: 'বর্তমান মোড',
      business: 'ব্যবসা',
      personal: 'ব্যক্তিগত',
      workspaceOwner: 'অ্যাকাউন্ট মালিক',
      adminPortal: 'অ্যাডমিন পোর্টাল',
      openMenu: 'সব পেজ / মেনু',
    },
    login: {
      kicker: 'EkTally · ব্যবসা ও ব্যক্তিগত হিসাবের দ্বৈত প্ল্যাটফর্ম',
      headlinePrefix: 'আপনার',
      headlineHighlight: 'ব্যবসা ও ব্যক্তিগত',
      headlineSuffix: 'খরচের নিরাপদ হিসাব।',
      subtitle:
        'এক ক্লিকেই বিজনেস (ফেসবুক অ্যাডস, স্টক, কাস্টমার, কাস্টম রসিদ) এবং পার্সোনাল (বাজার, বিল, মাসিক বাজেট) মোডে সুইচ করুন—সম্পূর্ণ নিজস্ব প্রাইভেট ডেটা সুরক্ষাসহ।',
      highlight1Title: 'দ্বৈত ওয়ার্কস্পেস',
      highlight1Desc: 'একই টগলে ব্যবসা ও ব্যক্তিগত দৈনিক হিসাব',
      highlight2Title: 'বাংলাদেশ উপযোগী',
      highlight2Desc: 'BDT ৳, বিকাশ, নগদ, রকেট ও A4/80mm রসিদ',
      highlight3Title: 'সম্পূর্ণ সুরক্ষিত',
      highlight3Desc: 'শুধুমাত্র আপনার ভেরিফায়েড অ্যাকাউন্টে সীমাবদ্ধ',
      workspaceTag: 'EkTally ওয়ার্কস্পেস',
      signInTitle: 'আপনার হিসাবে সাইন ইন করুন',
      registerTitle: 'প্রাইভেট ওয়ার্কস্পেস তৈরি করুন',
      authSubtitle:
        'আপনার রসিদ, ইনভেন্টরি, কাস্টমার এবং ব্যক্তিগত বাজেটের সকল তথ্য সম্পূর্ণ গোপন ও নিরাপদ থাকবে।',
      preparingWorkspace: 'আপনার প্রাইভেট ওয়ার্কস্পেস তৈরি হচ্ছে...',
      checkingSession: 'সেশন যাচাই করা হচ্ছে...',
      connectingDb: 'সুরক্ষিত ডেটাবেজের সাথে যুক্ত হচ্ছে',
      verifyEmailTitle: 'আপনার ইমেইল যাচাই করুন',
      verifyEmailDescPrefix: 'একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে:',
      verifyEmailDescSuffix:
        'ডেটাবেজ নিরাপত্তার জন্য প্রাইভেট ওয়ার্কস্পেস খোলার আগে ইমেইল ভেরিফিকেশন সম্পন্ন করা বাধ্যতামূলক।',
      checkingStatus: 'অবস্থা যাচাই হচ্ছে...',
      iveVerified: 'ভেরিফাই করেছি — ওয়ার্কস্পেস খুলুন',
      resendVerification: 'পুনরায় ভেরিফিকেশন ইমেইল পাঠান',
      sendVerification: 'ভেরিফিকেশন ইমেইল পাঠান',
      signOutSwitch: 'সাইন আউট ও অ্যাকাউন্ট পরিবর্তন',
      signInTab: 'সাইন ইন',
      createAccountTab: 'অ্যাকাউন্ট তৈরি',
      yourName: 'আপনার নাম *',
      businessName: 'ব্যবসার নাম *',
      emailAddress: 'ইমেইল ঠিকানা *',
      password: 'পাসওয়ার্ড *',
      confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন *',
      passwordPlaceholderLogin: 'পাসওয়ার্ড লিখুন',
      passwordPlaceholderRegister: 'কমপক্ষে ৬ অক্ষর',
      reenterPassword: 'আবার পাসওয়ার্ড লিখুন',
      rememberSession: 'এই ডিভাইসে লগইন ধরে রাখুন',
      signingIn: 'সাইন ইন হচ্ছে...',
      creatingWorkspace: 'অ্যাকাউন্ট তৈরি হচ্ছে...',
      signInWithEmail: 'ইমেইল দিয়ে সাইন ইন',
      createPrivateAccount: 'প্রাইভেট অ্যাকাউন্ট তৈরি করুন',
      checkSpamHint: 'ভেরিফিকেশন লিংকটি পেতে আপনার Inbox এবং Spam/Junk ফোল্ডার উভয়ই চেক করুন।',
      verificationAutoDetect: 'লিংকে ক্লিক করার সাথে সাথেই স্বয়ংক্রিয়ভাবে যাচাই হয়ে যাবে।',
      verificationSentNotice: 'ভেরিফিকেশন লিংক পাঠানো হয়েছে। ইনবক্স বা স্প্যাম ফোল্ডার চেক করে লিংকে ক্লিক করুন এবং "ভেরিফাই করেছি" চাপুন।',
      verificationNotYetNotice: 'ইমেইল এখনও ভেরিফাই হয়নি। অনুগ্রহ করে ইনবক্স বা স্প্যাম ফোল্ডারের লিংকে ক্লিক করুন।',
      verificationTooManyNotice: 'অনেকবার ইমেইল পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স/স্প্যাম চেক করুন অথবা ১ মিনিট অপেক্ষা করুন।',
      namePlaceholder: 'যেমন: তানভীর আহমেদ',
      businessPlaceholder: 'যেমন: ঢাকাইয়া ফ্যাশন',
      emailPlaceholder: 'you@business.com',
      showPassword: 'পাসওয়ার্ড দেখুন',
      hidePassword: 'পাসওয়ার্ড লুকান',
      forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
      sendingResetLink: 'রিসেট লিংক পাঠানো হচ্ছে...',
      resetEmailSentNotice: 'আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। নতুন পাসওয়ার্ড সেট করতে Inbox বা Spam ফোল্ডার চেক করুন।',
      enterEmailForReset: 'প্রথমে উপরের ঘরে আপনার অ্যাকাউন্টের ইমেইল লিখুন, তারপর "পাসওয়ার্ড ভুলে গেছেন?" চাপুন।',
    },
    dashboard: {
      addProduct: 'পণ্য যোগ করুন',
      logBusinessExpense: 'ব্যবসায়িক খরচ লিখুন',
      quickLogExpense: 'খরচ লিখুন',
      businessCsv: 'বিজনেস CSV',
      personalCsv: 'পার্সোনাল CSV',
      inventoryCsv: 'স্টক CSV',
      businessExpenses: 'ব্যবসায়িক খরচ',
      loggedTransactions: 'টি লেনদেন',
      marketingAdsSpend: 'মার্কেটিং ও অ্যাড খরচ',
      ofPeriodExpenditure: '% মোট খরচের অংশ',
      inventoryCostValue: 'স্টকের ক্রয়মূল্য',
      estRetail: 'আনুমানিক বিক্রয়মূল্য',
      totalUnitsStocked: 'মোট মজুত পণ্য',
      skus: 'টি পণ্য',
      lowOutAlert: 'টি কম/স্টক আউট সতর্কতা',
      thisMonthSpending: 'এই মাসের খরচ',
      entriesInRange: 'টি এন্ট্রি নির্বাচিত সময়ে',
      monthlyBudgetCap: 'মাসিক বাজেট সীমা',
      remaining: 'অবশিষ্ট',
      overCap: 'সীমা অতিক্রম',
      cap: 'বাজেট',
      dailyAverageSpend: 'দৈনিক গড় খরচ',
      acrossDaysPrefix: 'এই মাসের',
      acrossDaysSuffix: 'দিনের হিসাবে',
      todaysSpendDhaka: 'আজকের খরচ (ঢাকা)',
      periodTotal: 'মোট সময়কালের খরচ',
      pnlCardTitle: 'ব্যবসার লাভ, ক্ষতি ও বিনিয়োগ হিসাব',
      pnlCardDesc:
        'পার্টনার ও বিনিয়োগ, ব্যবসায়িক খরচ এবং কাস্টমার বিক্রয় থেকে সরাসরি লাভ-ক্ষতির হিসাব।',
      totalInvestedLabel: 'মোট বিনিয়োগ (পার্টনার ও ইনভেস্ট)',
      partnersWord: 'জন পার্টনার',
      partnerDueLabel: 'বকেয়া',
      customerSalesLabel: 'কাস্টমার বিক্রয় (আয়)',
      customersWord: 'জন কাস্টমার',
      ordersWord: 'টি অর্ডার',
      totalBusinessCostLabel: 'মোট খরচ (ব্যবসায়িক ব্যয়)',
      selectedPeriodLabel: 'নির্বাচিত সময়',
      netProfitLossLabel: 'নিট লাভ / ক্ষতি',
      profitBadge: 'লাভ',
      lossBadge: 'ক্ষতি',
      breakEvenBadge: 'সমান সমান',
      capitalBalanceLabel: 'মোট মূলধন ব্যালেন্স (বিনিয়োগ + বিক্রয় − খরচ)',
      roiLabel: 'বিনিয়োগে ROI',
    },
    expenses: {
      logBusinessExpense: 'ব্যবসায়িক খরচ যোগ করুন',
      logDailyExpense: 'দৈনিক খরচ যোগ করুন',
      searchBusiness: 'অ্যাডস, মডেল, কুরিয়ার, সাপ্লায়ার বা বিকাশ/নগদ খুঁজুন...',
      searchPersonal: 'বাজার, বিল, সিএনজি/উবার, শপিং বা বিকাশ/নগদ খুঁজুন...',
      allBusiness: 'সব ব্যবসায়িক',
      allPersonal: 'সব ব্যক্তিগত',
      entries: 'টি এন্ট্রি',
      total: 'মোট',
      noExpensesTitle: 'কোনো খরচ পাওয়া যায়নি',
      noBusinessEmpty: 'মেটা অ্যাডস, ফটোশুট, প্যাকেজিং বা কুরিয়ার খরচ যোগ করুন।',
      noPersonalEmpty: 'বাজার, বিল, যাতায়াত বা দৈনন্দিন ব্যক্তিগত খরচ যোগ করুন।',
      date: 'তারিখ',
      titleDetails: 'বিবরণ',
      category: 'ক্যাটাগরি',
      payment: 'পেমেন্ট মাধ্যম',
      receipt: 'রসিদ',
      amount: 'পরিমাণ',
      manageCategories: 'ক্যাটাগরি যোগ / মুছুন',
      doneManaging: 'সম্পন্ন',
      addCategoryPlaceholder: 'নতুন ক্যাটাগরির নাম লিখুন...',
      addCategoryBtn: 'যোগ করুন',
      restoreDefaults: 'ডিফল্ট ফিরিয়ে আনুন',
      deleteCategoryTitle: 'ক্যাটাগরি মুছুন',
      duplicateCategory: 'এই ক্যাটাগরিটি ইতোমধ্যেই রয়েছে।',
      categoryPhoto: 'ছবি',
      uploadPhoto: 'ছবি যোগ করুন',
      changePhoto: 'ছবি পরিবর্তন',
      removePhoto: 'ছবি মুছুন',
      quantity: 'পরিমাণ (পিস)',
      perPiecePrice: 'প্রতি পিস মূল্য',
      editCategory: 'ক্যাটাগরি সম্পাদনা',
      saveCategory: 'সংরক্ষণ',
      cancelEdit: 'বাতিল',
    },
    products: {
      addProduct: 'পণ্য যোগ করুন',
      addFirstProduct: 'প্রথম পণ্য যোগ করুন',
      searchPlaceholder: 'SKU, পণ্যের নাম বা নোট খুঁজুন...',
      allCategories: 'সব ক্যাটাগরি',
      inStock: 'স্টকে আছে',
      lowStock: 'স্টক কম',
      outOfStock: 'স্টক শেষ',
      noProductsTitle: 'স্টকে কোনো পণ্য নেই',
      noProductsDesc: 'ক্রয়মূল্য, বিক্রয়মূল্য, স্টক সংখ্যা ও ছবিসহ নতুন পণ্য যোগ করুন।',
      photo: 'ছবি',
      productSku: 'পণ্য ও SKU',
      cost: 'ক্রয়মূল্য',
      selling: 'বিক্রয়মূল্য',
      stockLevel: 'স্টক সংখ্যা',
      photos: 'টি ছবি',
    },
    customers: {
      addCustomer: 'কাস্টমার যোগ করুন',
      addFirstCustomer: 'প্রথম কাস্টমার যোগ করুন',
      savedCustomers: 'সংরক্ষিত কাস্টমার',
      recordedOrders: 'মোট অর্ডার',
      lifetimeValue: 'মোট কাস্টমার লেনদেন',
      searchPlaceholder: 'কাস্টমারের নাম, মোবাইল, লোকেশন, পণ্য বা অর্ডার তথ্য খুঁজুন...',
      showingOf: 'দেখানো হচ্ছে',
      customersWord: 'জন কাস্টমার',
      noCustomersTitle: 'এখনো কোনো কাস্টমার সংরক্ষণ করা হয়নি',
      noCustomersDesc:
        'ফোন, লোকেশন, কোন নাম্বার অপশন, পণ্যের নাম, সাইজ ও প্রতি পিস দামসহ কাস্টমার ও অর্ডার তথ্য সংরক্ষণ করুন।',
      customer: 'কাস্টমার',
      bdPhone: 'মোবাইল ও অপশন',
      districtAddress: 'লোকেশন / ঠিকানা',
      orders: 'অর্ডার',
      totalSpent: 'মোট খরচ',
      receiptBtn: 'রসিদ',
      orderProductCol: 'অর্ডার ও পণ্যের বিবরণ',
      numberOptionLabel: 'কোন নাম্বার অপশন',
      locationDistrictLabel: 'লোকেশন (জেলা)',
      locationAddressLabel: 'সম্পূর্ণ ডেলিভারি লোকেশন / ঠিকানা',
      orderSectionTitle: 'অর্ডার ও পণ্যের বিবরণ',
      quickPickProduct: 'স্টক থেকে পণ্য বাছাই করুন (ঐচ্ছিক)',
      selectFromInventory: 'অটো-ফিল করতে পণ্য নির্বাচন করুন...',
      productNameLabel: 'পণ্যের নাম',
      productSizeLabel: 'পণ্যের সাইজ',
      quantityLabel: 'পরিমাণ (পিস)',
      tkPerProductLabel: 'প্রতি পণ্যের দাম (৳ টাকা)',
      deliveryChargeLabel: 'ডেলিভারি চার্জ (৳ টাকা)',
      deliveryChargeShort: 'ডেলিভারি',
      orderTotalLabel: 'অর্ডার মোট',
      orderDetailsLabel: 'অর্ডারের বিবরণ / নোট',
      recordNewOrderLabel: 'নতুন অর্ডার হিসেবে যোগ করুন (+১ অর্ডার ও মোট খরচে যোগ হবে)',
      sizeWord: 'সাইজ',
      perPcWord: 'প্রতি পিস',
      sendToPathaoBtn: 'পাঠাও',
      saveAndSendPathaoBtn: 'সংরক্ষণ ও পাঠাওয়ে পাঠান',
      exportAllCsv: 'সব অর্ডার CSV',
      exportSelectedCsv: 'নির্বাচিত অর্ডার CSV',
      selectAllVisible: 'সব নির্বাচন',
      clearSelection: 'বাতিল',
      selectedCountWord: 'টি নির্বাচিত',
      zoneLabel: 'জোন / এলাকা (Zone) *',
      areaLabel: 'এরিয়া (Area - ঐচ্ছিক)',
      itemTypeLabel: 'আইটেমের ধরন',
      itemWeightLabel: 'ওজন (কেজি)',
      storeNameLabel: 'স্টোরের নাম (ঐচ্ছিক)',
      merchantOrderIdLabel: 'মার্চেন্ট অর্ডার আইডি (ঐচ্ছিক)',
      parcelOption: 'parcel',
      documentOption: 'document',
      specialInstructionLabel: 'বিশেষ নির্দেশনা / নোট',
      orderStatusLabel: 'অর্ডারের অবস্থা / ক্যাটাগরি',
      filterAllOrders: 'সব অর্ডার',
      statusPending: 'অপেক্ষমাণ',
      statusReceived: 'অর্ডার রিসিভড',
      statusRejected: 'রিজেক্টেড / রিসিভ করেনি',
      statusNoCall: 'কল রিসিভ করেনি',
    },
    partners: {
      pageTitle: 'বিজনেস পার্টনার ও বিনিয়োগ',
      addPartners: 'পার্টনার যোগ করুন',
      addFirstPartner: 'প্রথম পার্টনার যোগ করুন',
      exportCsv: 'পার্টনার CSV',
      totalPartners: 'মোট পার্টনার',
      totalInvested: 'মোট বিনিয়োগ (Invest)',
      totalDue: 'মোট বকেয়া (Due)',
      totalEquity: 'মোট শেয়ার %',
      searchPlaceholder: 'পার্টনারের নাম, ফোন বা নোট খুঁজুন...',
      filterAll: 'সব পার্টনার',
      filterDue: 'বকেয়া আছে',
      filterSettled: 'পরিশোধিত',
      showingOf: 'দেখানো হচ্ছে',
      partnersWord: 'জন পার্টনার',
      noPartnersTitle: 'এখনো কোনো বিজনেস পার্টনার যোগ করা হয়নি',
      noPartnersDesc:
        'এক বা একাধিক পার্টনারের নাম, বিনিয়োগের পরিমাণ (Invest), বকেয়া (Due) এবং শেয়ার % হিসাব সংরক্ষণ করুন।',
      partnerCol: 'পার্টনার',
      shareCol: 'শেয়ার %',
      investCol: 'বিনিয়োগ (Invest)',
      dueCol: 'বকেয়া (Due)',
      statusCol: 'অবস্থা',
      partnerNameLabel: 'পার্টনারের নাম *',
      partnerPhoneLabel: 'মোবাইল নম্বর (ঐচ্ছিক)',
      investAmountLabel: 'বিনিয়োগ (Invest)',
      dueAmountLabel: 'বকেয়া (Due)',
      sharePercentLabel: 'শেয়ার % (ঐচ্ছিক)',
      currencyLabel: 'মুদ্রা',
      notesLabel: 'নোট / চুক্তির বিবরণ',
      addAnotherRow: 'আরও পার্টনার যোগ করুন',
      removeRow: 'বাদ দিন',
      clearDue: 'বকেয়া শোধ',
      settledBadge: 'পরিশোধিত',
      duePendingBadge: 'বকেয়া আছে',
      modalAddTitle: 'বিজনেস পার্টনার যোগ করুন',
      modalEditTitle: 'পার্টনার তথ্য সম্পাদনা',
      modalSubtitle:
        'একসাথে এক বা একাধিক পার্টনারের নাম, বিনিয়োগ (Invest) ও বকেয়া (Due) হিসাব যোগ করুন।',
      partnerRowPrefix: 'পার্টনার',
      savePartner: 'পার্টনার সংরক্ষণ',
      saveAllPartners: 'সব পার্টনার সংরক্ষণ',
      updatePartner: 'পার্টনার আপডেট',
      batchTotalLabel: 'মোট হিসাব',
    },
    loans: {
      pageTitle: 'ব্যক্তিগত ধার ও লোন হিসাব',
      addLoan: 'নতুন লোন যোগ করুন',
      addFirstLoan: 'প্রথম লোন যোগ করুন',
      exportCsv: 'লোন CSV',
      lentOutTitle: 'ধার দেওয়া (মানুষের কাছে পাবো)',
      borrowedTitle: 'ধার নেওয়া (মানুষকে দিবো)',
      netPositionTitle: 'নিট লোন ব্যালেন্স',
      peopleTrackedTitle: 'মোট মানুষ',
      peopleWord: 'জন',
      personWord: 'জন',
      entriesWord: 'টি এন্ট্রি',
      principalWord: 'মোট আসল',
      theyOweYou: 'আপনি নিট পাবেন',
      youOweThem: 'আপনাকে নিট দিতে হবে',
      balancedLabel: 'সব সমান',
      peopleSummaryTitle: 'নাম অনুযায়ী সারাংশ',
      allPeopleChip: 'সব মানুষ',
      searchPlaceholder: 'নাম, মোবাইল বা নোট দিয়ে খুঁজুন...',
      filterAll: 'সবগুলো',
      filterGiven: 'ধার দেওয়া',
      filterTaken: 'ধার নেওয়া',
      filterPending: 'বাকি আছে',
      filterSettled: 'পরিশোধিত',
      showingOf: 'দেখানো হচ্ছে',
      loansWord: 'টি লোন',
      noLoansTitle: 'এখনো কোনো ধার বা লোনের হিসাব নেই',
      noLoansDesc:
        'কতজন মানুষ আপনার থেকে টাকা নিয়েছে এবং আপনি অন্যদের থেকে কত টাকা ধার নিয়েছেন তা নামসহ সংরক্ষণ করুন।',
      directionCol: 'ধরন',
      personCol: 'ব্যক্তির নাম',
      dateCol: 'তারিখ',
      amountCol: 'মোট টাকা',
      paidCol: 'পরিশোধ',
      remainingCol: 'বাকি',
      statusCol: 'অবস্থা',
      givenBadge: 'ধার দেওয়া (পাবো)',
      takenBadge: 'ধার নেওয়া (দিবো)',
      settledBadge: 'পরিশোধিত',
      pendingBadge: 'বাকি আছে',
      markSettled: 'পরিশোধ সম্পন্ন',
      addRepayment: 'জমা দিন',
      repaymentPromptLabel: 'পরিশোধিত টাকা',
      saveRepayment: 'জমা',
      modalAddTitle: 'ব্যক্তিগত লোন / ধার যোগ করুন',
      modalEditTitle: 'লোন তথ্য সম্পাদনা',
      modalSubtitle:
        'আপনার থেকে কে কত টাকা নিয়েছে অথবা আপনি কার থেকে কত টাকা নিয়েছেন তা নামসহ লিখুন।',
      directionLabel: 'লোনের ধরন *',
      directionGivenOption: 'আমার থেকে নিয়েছে (ধার দেওয়া)',
      directionTakenOption: 'আমি অন্যের থেকে নিয়েছি (ধার নেওয়া)',
      personNameLabel: 'ব্যক্তির নাম *',
      personNamePlaceholder: 'যেমন: করিম মিয়া',
      phoneLabel: 'মোবাইল নম্বর (ঐচ্ছিক)',
      loanAmountLabel: 'টাকার পরিমাণ (৳) *',
      paidAmountLabel: 'ইতোমধ্যে পরিশোধিত (৳)',
      currencyLabel: 'মুদ্রা',
      dateLabel: 'তারিখ *',
      dueDateLabel: 'ফেরতের তারিখ (ঐচ্ছিক)',
      notesLabel: 'নোট / কারণ',
      notesPlaceholder: 'হাতে ধার, বিকাশ TrxID বা ফেরতের কথা...',
      addAnotherRow: 'আরও ব্যক্তি যোগ করুন',
      removeRow: 'বাদ দিন',
      rowPrefix: 'ব্যক্তি',
      saveLoan: 'লোন সংরক্ষণ',
      saveAllLoans: 'সব লোন সংরক্ষণ',
      updateLoan: 'লোন আপডেট',
      batchTotalLabel: 'মোট হিসাব',
      overviewCardTitle: 'ব্যক্তিগত ধার ও লোন (নামসহ)',
      overviewCardDesc: 'কে আপনার কাছে ঋণী এবং আপনি কার কাছে ঋণী তা দেখুন।',
      manageLoansBtn: 'লোন হিসাব দেখুন',
    },
    pathao: {
      pageTitle: 'পাঠাও কুরিয়ার ডেলিভারি',
      newParcel: 'নতুন পাঠাও পার্সেল',
      pickCustomerLabel: 'সেভ করা কাস্টমার থেকে পাঠান',
      pickCustomerPlaceholder: 'কাস্টমার (অর্ডার) থেকে একজন নির্বাচন করুন...',
      exportBulkCsv: 'পাঠাও বাল্ক CSV',
      serverConnectedTitle: 'পাঠাও কুরিয়ার API সংযুক্ত',
      serverConnectedDesc:
        'আপনার সার্ভার এনভায়রনমেন্টের মাধ্যমে সরাসরি পার্সেল বুকিং ও লাইভ ট্র্যাকিং চালু আছে।',
      serverNotConfiguredTitle: 'সার্ভারে পাঠাও API কী এখনও সেট করা হয়নি',
      serverNotConfiguredDesc:
        'সরাসরি পাঠাওয়ে পাঠাতে সার্ভারে .env ফাইলে PATHAO_BASE_URL (https://api-hermes.pathao.com বা স্যান্ডবক্স), PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, PATHAO_PASSWORD ও PATHAO_DEFAULT_STORE_ID (অথবা প্রতি ইউজার/ব্যবসার জন্য PATHAO_MERCHANTS_JSON) যোগ করুন। তবুও আপনি ড্রাফট সেভ ও পাঠাও বাল্ক CSV ডাউনলোড করতে পারবেন।',
      totalParcels: 'মোট পার্সেল',
      dispatchedCount: 'পাঠাওয়ে পাঠানো',
      queuedCount: 'অপেক্ষমাণ ড্রাফট',
      totalCodAmount: 'মোট COD টাকা',
      totalDeliveryFees: 'ডেলিভারি চার্জ',
      searchPlaceholder: 'কাস্টমার, মোবাইল, কনসাইনমেন্ট আইডি, অর্ডার আইডি বা ঠিকানা খুঁজুন...',
      filterAll: 'সব',
      filterDispatched: 'পাঠাওয়ে পাঠানো',
      filterQueued: 'ড্রাফট / কিউ',
      showingOf: 'দেখানো হচ্ছে',
      parcelsWord: 'টি পার্সেল',
      noParcelsTitle: 'এখনো কোনো পাঠাও পার্সেল নেই',
      noParcelsDesc:
        'কাস্টমার (অর্ডার) পেজ থেকে কাস্টমার যোগ করে "সংরক্ষণ ও পাঠাওয়ে পাঠান" চাপুন অথবা উপর থেকে কাস্টমার নির্বাচন করুন।',
      consignmentCol: 'অর্ডার ও কনসাইনমেন্ট',
      recipientCol: 'কাস্টমার ও ঠিকানা',
      itemCol: 'পার্সেলের বিবরণ',
      codCol: 'COD (৳)',
      feeCol: 'চার্জ',
      statusCol: 'অবস্থা',
      sendNowBtn: 'এখনই পাঠান',
      sendingBtn: 'পাঠানো হচ্ছে...',
      refreshBtn: 'ট্র্যাক',
      refreshingBtn: 'যাচাই হচ্ছে...',
      queuedBadge: 'কিউ ড্রাফট',
      apiBadge: 'পাঠাও লাইভ',
      modalTitle: 'পাঠাও কুরিয়ারে অর্ডার পাঠান',
      modalEditTitle: 'পাঠাও পার্সেল সম্পাদনা / প্রেরণ',
      modalSubtitle:
        'কাস্টমারের ঠিকানা ও অর্ডারের মোট টাকা অটো-ফিল করা হয়েছে। যাচাই করে সরাসরি পাঠাওয়ে পাঠান বা কিউতে সেভ করুন।',
      storeLabel: 'পিকআপ স্টোর *',
      loadingStores: 'পাঠাও স্টোর লোড হচ্ছে...',
      noStoreFallback: 'ডিফল্ট সার্ভার স্টোর',
      orderIdLabel: 'মার্চেন্ট অর্ডার আইডি *',
      recipientNameLabel: 'কাস্টমারের নাম *',
      recipientPhoneLabel: 'কাস্টমারের মোবাইল (১১ ডিজিট) *',
      districtLabel: 'জেলা / শহর',
      addressLabel: 'সম্পূর্ণ ডেলিভারি ঠিকানা *',
      addressHint: 'পাঠাও অটো-রাউটিংয়ের জন্য বাসা, রোড, এলাকা/থানা ও জেলা লিখুন (কমপক্ষে ১০ অক্ষর)।',
      deliveryTypeLabel: 'ডেলিভারির ধরন',
      normalDelivery: 'নরমাল ডেলিভারি (৪৮ ঘণ্টা)',
      onDemandDelivery: 'এক্সপ্রেস / অন-ডিমান্ড (১২ ঘণ্টা)',
      itemTypeLabel: 'পার্সেলের ধরন',
      parcelType: 'পার্সেল',
      documentType: 'ডকুমেন্ট',
      quantityLabel: 'পরিমাণ (পিস) *',
      weightLabel: 'ওজন (কেজি) *',
      codAmountLabel: 'ক্যাশ অন ডেলিভারি (৳ COD) *',
      itemDescLabel: 'পণ্যের বিবরণ',
      instructionLabel: 'বিশেষ নির্দেশনা (কুরিয়ার নোট)',
      sendToPathaoSubmit: 'সরাসরি পাঠাওয়ে পাঠান',
      saveQueueDraftBtn: 'পাঠাও কিউতে সেভ করুন',
      dispatchSuccessPrefix: 'পাঠাওয়ে পাঠানো হয়েছে! কনসাইনমেন্ট আইডি:',
      queueSuccessMsg: 'পাঠাও কিউতে সংরক্ষিত হয়েছে। পরে পাঠাতে পারবেন অথবা বাল্ক CSV ডাউনলোড করুন।',
    },
    receipts: {
      newBlankReceipt: 'নতুন রসিদ',
      saveBrandStyle: 'ব্র্যান্ড স্টাইল সংরক্ষণ',
      downloadPdf: 'PDF ডাউনলোড',
      downloadPng: 'PNG ডাউনলোড',
      print: 'প্রিন্ট',
      brandStyleTab: 'ব্র্যান্ড ও ডিজাইন',
      customerTab: 'কাস্টমার ও ডেলিভারি',
      itemsTotalsTab: 'পণ্য ও হিসাব',
      livePreview: 'লাইভ প্রিভিউ',
      savedReceipts: 'সংরক্ষিত রসিদসমূহ',
    },
    settings: {
      sectionTitle: 'ওয়ার্কস্পেস, মুদ্রা ও ব্যক্তিগত বাজেট সেটিংস',
      sectionDesc:
        'আপনার ব্যবসার তথ্য, BDT/USD রেট, লো-স্টক সতর্কতা এবং মাসিক ব্যক্তিগত বাজেট সীমা নির্ধারণ করুন।',
      businessSectionTitle: 'ব্যবসার সেটিংস, মুদ্রা ও স্টক সতর্কতা',
      businessSectionDesc:
        'আপনার ব্যবসার তথ্য, BDT/USD বিনিময় হার এবং লো-স্টক সতর্কতা সীমা নির্ধারণ করুন।',
      personalSectionTitle: 'ব্যক্তিগত বাজেট ও মুদ্রা সেটিংস',
      personalSectionDesc:
        'আপনার মাসিক ব্যক্তিগত খরচের বাজেট সীমা, ডিফল্ট মুদ্রা এবং ব্যক্তিগত তথ্য নির্ধারণ করুন।',
      businessNameLabel: 'ব্যবসা / ব্র্যান্ডের নাম *',
      ownerNameLabel: 'অ্যাকাউন্ট মালিকের নাম *',
      defaultCurrencyLabel: 'ডিফল্ট মুদ্রা',
      usdRateLabel: 'USD থেকে BDT বিনিময় হার',
      monthlyBudgetLabel: 'মাসিক ব্যক্তিগত বাজেট সীমা (৳ টাকা)',
      lowStockLabel: 'লো-স্টক সতর্কতা সীমা',
      bdPhoneLabel: 'যোগাযোগের নম্বর (+8801XXXXXXXXX)',
      addressLabel: 'অফিস / বাসার ঠিকানা',
      businessAddressLabel: 'ব্যবসা / অফিসের ঠিকানা',
      homeAddressLabel: 'বাসার ঠিকানা',
      saveSettings: 'সেটিংস সংরক্ষণ করুন',
      saveBusinessSettings: 'ব্যবসার সেটিংস সংরক্ষণ করুন',
      savePersonalSettings: 'ব্যক্তিগত সেটিংস সংরক্ষণ করুন',
      savedBusinessMsg: 'ব্যবসার সেটিংস সংরক্ষণ হয়েছে।',
      savedPersonalMsg: 'ব্যক্তিগত বাজেট সেটিংস সংরক্ষণ হয়েছে।',
      privacyTitle: 'ডেটা প্রাইভেসি ও ব্যাকআপ ডাউনলোড',
      privacyDesc:
        'আপনার সকল খরচ, স্টক, কাস্টমার, রসিদ এবং ছবি শুধুমাত্র আপনার User UID-তে সম্পূর্ণ সুরক্ষিত।',
      businessPrivacyDesc:
        'আপনার ব্যবসার সকল খরচ, স্টক, কাস্টমার, পার্টনার এবং রসিদ শুধুমাত্র আপনার User UID-তে সুরক্ষিত।',
      personalPrivacyDesc:
        'আপনার সকল ব্যক্তিগত খরচ এবং লোন/ধার হিসাব শুধুমাত্র আপনার User UID-তে সুরক্ষিত।',
      verifiedAccount: 'ভেরিফায়েড অ্যাকাউন্ট',
      downloadBackups: 'প্রাইভেট হিসাবের ব্যাকআপ ডাউনলোড করুন',
      allExpensesCsv: 'সব খরচের CSV',
      businessExpensesCsv: 'ব্যবসার খরচের CSV',
      personalExpensesCsv: 'ব্যক্তিগত খরচের CSV',
      personalLoansCsv: 'ব্যক্তিগত লোন CSV',
      inventoryCsv: 'স্টক CSV',
    },
    profile: {
      sectionTitle: 'আমার প্রোফাইল',
      sectionDesc: 'আপনার প্রোফাইল ছবি, নাম এবং ভেরিফায়েড অ্যাকাউন্টের তথ্য পরিবর্তন করুন।',
      photoLabel: 'প্রোফাইল ছবি',
      photoHint: 'JPEG, PNG বা WebP · স্বয়ংক্রিয়ভাবে ক্রপ ও অপ্টিমাইজ হবে',
      uploadPhoto: 'ছবি আপলোড করুন',
      changePhoto: 'ছবি পরিবর্তন করুন',
      removePhoto: 'ছবি মুছুন',
      displayNameLabel: 'আপনার নাম *',
      displayNamePlaceholder: 'যেমন: তানভীর আহমেদ',
      emailLabel: 'অ্যাকাউন্ট ইমেইল',
      emailReadOnlyHint: 'ভেরিফায়েড সাইন-ইন ইমেইল এখান থেকে পরিবর্তন করা যায় না।',
      saveProfile: 'প্রোফাইল সংরক্ষণ করুন',
      profileSaved: 'আপনার প্রোফাইল ছবি ও নাম সফলভাবে সংরক্ষণ হয়েছে।',
      verifiedBadge: 'ইমেইল ভেরিফায়েড',
      roleAdmin: 'অ্যাডমিনিস্ট্রেটর',
      roleOwner: 'ওয়ার্কস্পেস মালিক',
      passwordSectionTitle: 'পাসওয়ার্ড পরিবর্তন',
      passwordSectionDesc: 'নতুন পাসওয়ার্ড সেট করতে আপনার বর্তমান পাসওয়ার্ড যাচাই করুন।',
      currentPasswordLabel: 'বর্তমান পাসওয়ার্ড *',
      currentPasswordPlaceholder: 'বর্তমান পাসওয়ার্ড লিখুন',
      newPasswordLabel: 'নতুন পাসওয়ার্ড *',
      newPasswordPlaceholder: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড',
      confirmPasswordLabel: 'নতুন পাসওয়ার্ড নিশ্চিত করুন *',
      confirmPasswordPlaceholder: 'আবার নতুন পাসওয়ার্ড লিখুন',
      passwordHint: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন যা বর্তমান পাসওয়ার্ড থেকে আলাদা।',
      updatePassword: 'পাসওয়ার্ড আপডেট করুন',
      updatingPassword: 'আপডেট হচ্ছে...',
      passwordUpdated: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।',
      providerNoPassword: 'এই সাইন-ইন মাধ্যমের জন্য পাসওয়ার্ড পরিবর্তন প্রযোজ্য নয়।',
      manageProfileBtn: 'প্রোফাইল ও পাসওয়ার্ড',
      invalidImageFile: 'অনুগ্রহ করে একটি সঠিক JPEG, PNG বা WebP ছবি নির্বাচন করুন।',
    },
    business: {
      yourBusinessName: 'আপনার ব্যবসার নাম যোগ করুন',
      activeBusinessLabel: 'বর্তমান ব্যবসা',
      addBusiness: 'ব্যবসা যোগ করুন',
      addNewBusiness: 'নতুন ব্যবসা যোগ করুন',
      switchBusiness: 'ব্যবসা পরিবর্তন করুন',
      businessPlaceholder: 'যেমন: ঢাকাইয়া ফ্যাশন',
      manageBusinesses: 'আপনার ব্যবসাসমূহ',
      manageBusinessesDesc:
        'একাধিক ব্যবসা তৈরি ও পরিবর্তন করুন। প্রতিটি ব্যবসার খরচ, স্টক, কাস্টমার এবং রসিদ আলাদা থাকবে।',
      primaryBusiness: 'মূল ব্যবসা',
      rename: 'নাম বদলান',
      saveName: 'সংরক্ষণ',
      cannotDeletePrimary: 'মূল ব্যবসা মুছে ফেলা যাবে না (তবে নাম পরিবর্তন করতে পারবেন)।',
      duplicateBusiness: 'এই নামে ইতোমধ্যেই একটি ব্যবসা রয়েছে।',
      confirmDeleteBusiness: 'মুছবেন?',
    },
    admin: {
      portalTitle: 'অ্যাডমিন ইউজার ও লগইন মনিটর',
      portalSubtitle: 'ভেরিফায়েড ইউজার সংখ্যা, ব্যবসার তালিকা এবং লগইনের সময় (ঢাকা সময়) রিয়েল-টাইমে দেখুন।',
      directLinkLabel: 'সরাসরি অ্যাডমিন লিংক',
      copyLink: '/admin লিংক কপি',
      linkCopied: 'কপি হয়েছে',
      exportUsersCsv: 'ইউজার CSV ডাউনলোড',
      totalUsers: 'মোট ইউজার',
      loggedInToday: 'আজ লগইন করেছে',
      totalLogins: 'মোট রেকর্ডকৃত লগইন',
      totalBusinesses: 'মোট ব্যবসা প্রোফাইল',
      searchPlaceholder: 'নাম, ইমেইল, ব্যবসার নাম বা UID দিয়ে খুঁজুন...',
      filterAll: 'সব ইউজার',
      filterToday: 'আজকের লগইন',
      filterLast7Days: 'গত ৭ দিন',
      filterPending: 'পরবর্তী লগইনের অপেক্ষায়',
      sortLatestLogin: 'সর্বশেষ লগইন',
      sortMostLogins: 'সর্বোচ্চ লগইন',
      sortNameAsc: 'নাম (A-Z)',
      sortFirstSeen: 'নতুন অ্যাকাউন্ট',
      userColumn: 'ইউজার',
      emailColumn: 'ইমেইল ঠিকানা',
      businessesColumn: 'ব্যবসাসমূহ',
      lastLoginColumn: 'সর্বশেষ লগইন সময়',
      firstSeenColumn: 'প্রথম দেখা / অ্যাকাউন্ট তৈরি',
      loginCountColumn: 'লগইন সংখ্যা',
      pendingNextLogin: 'পরবর্তী লগইনের পর আপডেট হবে',
      justNow: 'এইমাত্র',
      noUsersTitle: 'কোনো ইউজার পাওয়া যায়নি',
      noUsersDesc: 'সার্চ টেক্সট বা ফিল্টার পরিবর্তন করে আবার দেখুন।',
      showingCount: 'দেখানো হচ্ছে',
      usersWord: 'জন ইউজার',
      accessDeniedTitle: 'অ্যাডমিন অনুমতি প্রয়োজন',
      accessDeniedDesc: 'এই পোর্টাল (/admin) শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত। ইউজার সংখ্যা ও লগইন সময় দেখতে অ্যাডমিন অ্যাকাউন্ট দিয়ে সাইন ইন করুন।',
      backToDashboard: 'ড্যাশবোর্ডে ফিরে যান',
      adminBadge: 'ADMIN',
    },
    authErrors: {
      initFailed: 'আপনার প্রাইভেট ওয়ার্কস্পেস চালু করা যায়নি।',
      permissionDenied: 'ডেটাবেজ নিরাপত্তার কারণে অনুমতি পাওয়া যায়নি। আপনার ইমেইল ভেরিফাই করুন বা পুনরায় সাইন ইন করুন।',
      operationNotAllowed: 'Firebase Authentication-এ Email/Password সাইন-ইন চালু করা নেই।',
      emailInUse: 'এই ইমেইল দিয়ে ইতোমধ্যেই একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে সাইন ইন করুন।',
      invalidEmail: 'সঠিক ইমেইল ঠিকানা লিখুন।',
      weakPassword: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
      tooManyRequests: 'অনেকবার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।',
      invalidCredential: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।',
      signInFailed: 'সাইন ইন করা যায়নি। ইমেইল ও পাসওয়ার্ড যাচাই করুন।',
      registerFailed: 'অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।',
      sendVerificationFailed: 'এই মুহূর্তে ভেরিফিকেশন ইমেইল পাঠানো যাচ্ছে না।',
      checkVerificationFailed: 'ভেরিফিকেশন অবস্থা যাচাই করা যাচ্ছে না।',
    },
  },
};

const VALIDATION_BN_MAP: Record<string, string> = {
  'Enter a valid email address.': 'সঠিক ইমেইল ঠিকানা লিখুন।',
  'Password must be at least 6 characters.': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
  'Your name is required.': 'আপনার নাম লিখুন।',
  'Business or workspace name is required.': 'ব্যবসা বা ওয়ার্কস্পেসের নাম লিখুন।',
  'Passwords do not match.': 'দুটি পাসওয়ার্ড মিলছে না।',
  'Current password is required.': 'বর্তমান পাসওয়ার্ড লিখুন।',
  'Please confirm your new password.': 'নতুন পাসওয়ার্ডটি নিশ্চিত করুন।',
  'New password must be different from your current password.':
    'নতুন পাসওয়ার্ড অবশ্যই বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে।',
  'Name must be 120 characters or fewer.': 'নাম সর্বোচ্চ ১২০ অক্ষরের মধ্যে হতে হবে।',
};

export function translateValidationMessage(
  message: string | undefined,
  lang: AppLanguage,
  fallback: string
): string {
  if (!message) return fallback;
  if (lang === 'bn') {
    return VALIDATION_BN_MAP[message] || message;
  }
  return message;
}
