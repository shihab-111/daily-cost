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
  };
  nav: {
    overview: string;
    personalOverview: string;
    businessExpenses: string;
    dailyExpenses: string;
    productInventory: string;
    customersBd: string;
    receiptStudio: string;
    settingsData: string;
    settingsBudget: string;
    activeMode: string;
    business: string;
    personal: string;
    workspaceOwner: string;
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
    or: string;
    continueWithGoogle: string;
    openInFullTab: string;
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
    businessNameLabel: string;
    ownerNameLabel: string;
    defaultCurrencyLabel: string;
    usdRateLabel: string;
    monthlyBudgetLabel: string;
    lowStockLabel: string;
    bdPhoneLabel: string;
    addressLabel: string;
    saveSettings: string;
    privacyTitle: string;
    privacyDesc: string;
    verifiedAccount: string;
    downloadBackups: string;
    allExpensesCsv: string;
    inventoryCsv: string;
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
    },
    nav: {
      overview: 'Overview',
      personalOverview: 'Personal Overview',
      businessExpenses: 'Business Expenses',
      dailyExpenses: 'Daily Expenses',
      productInventory: 'Product Inventory',
      customersBd: 'Customers (BD)',
      receiptStudio: 'Receipt Studio',
      settingsData: 'Settings & Data',
      settingsBudget: 'Settings & Budget',
      activeMode: 'Active Mode',
      business: 'Business',
      personal: 'Personal',
      workspaceOwner: 'Workspace Owner',
    },
    login: {
      kicker: 'EkTally · Dual-Mode Business & Personal Ledger',
      headlinePrefix: 'Private Bangladesh',
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
      or: 'or',
      continueWithGoogle: 'Continue with Google',
      openInFullTab: 'Open in full browser tab for Google Sign-In',
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
      searchPlaceholder: 'Search customer name, +880 phone, district, or address...',
      showingOf: 'Showing',
      customersWord: 'customers',
      noCustomersTitle: 'No Customers Saved Yet',
      noCustomersDesc:
        'Save customer delivery details with validated BD phone numbers for one-click receipt generation.',
      customer: 'Customer',
      bdPhone: 'BD Phone',
      districtAddress: 'District & Address',
      orders: 'Orders',
      totalSpent: 'Total Spent',
      receiptBtn: 'Receipt',
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
      businessNameLabel: 'Business / Brand Name *',
      ownerNameLabel: 'Account Owner Name *',
      defaultCurrencyLabel: 'Default Currency',
      usdRateLabel: 'USD to BDT Conversion Rate',
      monthlyBudgetLabel: 'Personal Monthly Budget Cap (৳ BDT)',
      lowStockLabel: 'Default Low-Stock Alert Threshold',
      bdPhoneLabel: 'BD Contact Phone (+8801XXXXXXXXX)',
      addressLabel: 'Office / Home Address',
      saveSettings: 'Save Workspace Settings',
      privacyTitle: 'Multi-Tenant Privacy & Data Export',
      privacyDesc:
        'All expenses, inventory SKUs, customers, receipts, and uploaded photos are strictly isolated to your User UID.',
      verifiedAccount: 'Verified Account',
      downloadBackups: 'Download Private Ledger Backups',
      allExpensesCsv: 'All Expenses CSV',
      inventoryCsv: 'Inventory CSV',
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
    },
    nav: {
      overview: 'ওভারভিউ',
      personalOverview: 'ব্যক্তিগত ওভারভিউ',
      businessExpenses: 'ব্যবসায়িক খরচ',
      dailyExpenses: 'দৈনন্দিন খরচ',
      productInventory: 'পণ্য ও স্টক',
      customersBd: 'কাস্টমার (BD)',
      receiptStudio: 'রসিদ / মেমো স্টুডিও',
      settingsData: 'সেটিংস ও ডেটা',
      settingsBudget: 'সেটিংস ও বাজেট',
      activeMode: 'বর্তমান মোড',
      business: 'ব্যবসা',
      personal: 'ব্যক্তিগত',
      workspaceOwner: 'অ্যাকাউন্ট মালিক',
    },
    login: {
      kicker: 'EkTally · ব্যবসা ও ব্যক্তিগত হিসাবের দ্বৈত প্ল্যাটফর্ম',
      headlinePrefix: 'আপনার বাংলাদেশি',
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
      or: 'অথবা',
      continueWithGoogle: 'Google দিয়ে চালিয়ে যান',
      openInFullTab: 'Google সাইন-ইনের জন্য পূর্ণ ব্রাউজার ট্যাবে খুলুন',
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
      searchPlaceholder: 'কাস্টমারের নাম, +880 মোবাইল, জেলা বা ঠিকানা খুঁজুন...',
      showingOf: 'দেখানো হচ্ছে',
      customersWord: 'জন কাস্টমার',
      noCustomersTitle: 'এখনো কোনো কাস্টমার সংরক্ষণ করা হয়নি',
      noCustomersDesc:
        'এক ক্লিকে রসিদ তৈরি করতে ভেরিফায়েড বাংলাদেশি ফোন নম্বরসহ কাস্টমারের ঠিকানা সংরক্ষণ করুন।',
      customer: 'কাস্টমার',
      bdPhone: 'মোবাইল নম্বর',
      districtAddress: 'জেলা ও ঠিকানা',
      orders: 'অর্ডার',
      totalSpent: 'মোট খরচ',
      receiptBtn: 'রসিদ',
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
      businessNameLabel: 'ব্যবসা / ব্র্যান্ডের নাম *',
      ownerNameLabel: 'অ্যাকাউন্ট মালিকের নাম *',
      defaultCurrencyLabel: 'ডিফল্ট মুদ্রা',
      usdRateLabel: 'USD থেকে BDT বিনিময় হার',
      monthlyBudgetLabel: 'মাসিক ব্যক্তিগত বাজেট সীমা (৳ টাকা)',
      lowStockLabel: 'লো-স্টক সতর্কতা সীমা',
      bdPhoneLabel: 'যোগাযোগের নম্বর (+8801XXXXXXXXX)',
      addressLabel: 'অফিস / বাসার ঠিকানা',
      saveSettings: 'সেটিংস সংরক্ষণ করুন',
      privacyTitle: 'ডেটা প্রাইভেসি ও ব্যাকআপ ডাউনলোড',
      privacyDesc:
        'আপনার সকল খরচ, স্টক, কাস্টমার, রসিদ এবং ছবি শুধুমাত্র আপনার User UID-তে সম্পূর্ণ সুরক্ষিত।',
      verifiedAccount: 'ভেরিফায়েড অ্যাকাউন্ট',
      downloadBackups: 'প্রাইভেট হিসাবের ব্যাকআপ ডাউনলোড করুন',
      allExpensesCsv: 'সব খরচের CSV',
      inventoryCsv: 'স্টক CSV',
    },
  },
};
