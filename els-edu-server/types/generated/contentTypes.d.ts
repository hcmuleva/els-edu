import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAddressAddress extends Struct.CollectionTypeSchema {
  collectionName: 'addresses';
  info: {
    displayName: 'Address';
    pluralName: 'addresses';
    singularName: 'address';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address_line1: Schema.Attribute.String;
    address_line2: Schema.Attribute.String;
    city: Schema.Attribute.String;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    landmark: Schema.Attribute.String;
    latitude: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::address.address'
    > &
      Schema.Attribute.Private;
    longitude: Schema.Attribute.Decimal;
    org: Schema.Attribute.Relation<'oneToOne', 'api::org.org'>;
    postal_code: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    state: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_address: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiCalanderActivityCalanderActivity
  extends Struct.CollectionTypeSchema {
  collectionName: 'calander_activities';
  info: {
    displayName: 'calander-activity';
    pluralName: 'calander-activities';
    singularName: 'calander-activity';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'STUDY',
        'EXAM',
        'ASSIGNMENT',
        'MEETING',
        'EVENT',
        'ANNOUNCEMENT',
        'NEWS',
        'OTHER',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    creator: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    date: Schema.Attribute.Date;
    description: Schema.Attribute.Blocks;
    end_time: Schema.Attribute.Time;
    highlight_color: Schema.Attribute.Enumeration<
      ['ORANGE', 'BLUE', 'GREEN', 'YELLOW', 'RED', 'PURPLE']
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::calander-activity.calander-activity'
    > &
      Schema.Attribute.Private;
    orgs: Schema.Attribute.Relation<'manyToMany', 'api::org.org'>;
    publishedAt: Schema.Attribute.DateTime;
    start_time: Schema.Attribute.Time;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContentContent extends Struct.CollectionTypeSchema {
  collectionName: 'contents';
  info: {
    displayName: 'content';
    pluralName: 'contents';
    singularName: 'content';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    json_description: Schema.Attribute.Blocks;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::content.content'
    > &
      Schema.Attribute.Private;
    multimedia: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    publishedAt: Schema.Attribute.DateTime;
    subjects: Schema.Attribute.Relation<'manyToMany', 'api::subject.subject'>;
    title: Schema.Attribute.String;
    topic: Schema.Attribute.Relation<'manyToOne', 'api::topic.topic'>;
    type: Schema.Attribute.Enumeration<
      ['YOUTUBE', 'VIDEO', 'IMAGE', 'MD', 'TEXT', 'DOCUMENT', 'DOWNLOAD']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    youtubeurl: Schema.Attribute.String;
  };
}

export interface ApiCoursePricingCoursePricing
  extends Struct.CollectionTypeSchema {
  collectionName: 'course_pricings';
  info: {
    description: 'Pricing configuration for courses and subjects';
    displayName: 'Course Pricing';
    pluralName: 'course-pricings';
    singularName: 'course-pricing';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    auto_calculate_from_subjects: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    base_amount: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    calculated_total: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    course: Schema.Attribute.Relation<'oneToOne', 'api::course.course'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>;
    discount_percent: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    effective_from: Schema.Attribute.DateTime;
    effective_until: Schema.Attribute.DateTime;
    final_amount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::course-pricing.course-pricing'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pricing_type: Schema.Attribute.Enumeration<
      ['COURSE_BUNDLE', 'INDIVIDUAL_SUBJECTS', 'HYBRID']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'COURSE_BUNDLE'>;
    publishedAt: Schema.Attribute.DateTime;
    publisher: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    subject_pricings: Schema.Attribute.Relation<
      'oneToMany',
      'api::subject-pricing.subject-pricing'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCourseCourse extends Struct.CollectionTypeSchema {
  collectionName: 'courses';
  info: {
    displayName: 'course';
    pluralName: 'courses';
    singularName: 'course';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.String;
    condition: Schema.Attribute.Enumeration<
      ['DRAFT', 'REVIEW', 'REJECT', 'APPROVED', 'PUBLISH', 'RETIRED']
    >;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    coverphoto: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    creator: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    description: Schema.Attribute.RichText;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::course.course'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    previewvideo: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    privacy: Schema.Attribute.Enumeration<['PUBLIC', 'PRIVATE', 'ORG', 'OPEN']>;
    publishedAt: Schema.Attribute.DateTime;
    publisher: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    subcategory: Schema.Attribute.String;
    subjects: Schema.Attribute.Relation<'manyToMany', 'api::subject.subject'>;
    tags: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usersubscriptions: Schema.Attribute.Relation<
      'oneToMany',
      'api::usersubscription.usersubscription'
    >;
    visibility: Schema.Attribute.Enumeration<['GLOBAL', 'ORG', 'OTHER']>;
  };
}

export interface ApiCustomuserCustomUser extends Struct.CollectionTypeSchema {
  collectionName: 'custom_users';
  info: {
    displayName: 'custom-users';
    pluralName: 'custom-users';
    singularName: 'custom-user';
  };
  options: {
    comment: '';
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::customuser.custom-user'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInvoiceItemInvoiceItem extends Struct.CollectionTypeSchema {
  collectionName: 'invoice_items';
  info: {
    description: 'Individual line items in invoices with detailed breakdown';
    displayName: 'Invoice Item';
    pluralName: 'invoice-items';
    singularName: 'invoice-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    course: Schema.Attribute.Relation<'manyToOne', 'api::course.course'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    discount_amount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    discount_rate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>;
    item_description: Schema.Attribute.Text;
    item_name: Schema.Attribute.String & Schema.Attribute.Required;
    item_type: Schema.Attribute.Enumeration<
      [
        'COURSE',
        'SUBJECT',
        'PUBLISHER_COMMISSION',
        'PLATFORM_FEE',
        'TAX',
        'DISCOUNT',
        'SHIPPING',
        'OTHER',
      ]
    > &
      Schema.Attribute.Required;
    line_total: Schema.Attribute.Decimal & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice-item.invoice-item'
    > &
      Schema.Attribute.Private;
    net_amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    platform_fee_amount: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    platform_fee_rate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    publisher: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publisher_commission_amount: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    publisher_commission_rate: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    quantity: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    tax_amount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    tax_rate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    unit_price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInvoicePaymentInvoicePayment
  extends Struct.CollectionTypeSchema {
  collectionName: 'invoice_payments';
  info: {
    description: 'Payment records linked to invoices';
    displayName: 'Invoice Payment';
    pluralName: 'invoice-payments';
    singularName: 'invoice-payment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>;
    gateway_response: Schema.Attribute.JSON;
    gateway_transaction_id: Schema.Attribute.String;
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice-payment.invoice-payment'
    > &
      Schema.Attribute.Private;
    payment_date: Schema.Attribute.DateTime;
    payment_gateway: Schema.Attribute.Enumeration<
      [
        'CASHFREE',
        'RAZORPAY',
        'STRIPE',
        'PAYTM',
        'UPI',
        'NET_BANKING',
        'WALLET',
        'BANK_TRANSFER',
        'CASH',
        'CREDIT',
      ]
    >;
    payment_method_details: Schema.Attribute.JSON;
    payment_reference: Schema.Attribute.String & Schema.Attribute.Required;
    payment_status: Schema.Attribute.Enumeration<
      ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED']
    > &
      Schema.Attribute.DefaultTo<'PENDING'>;
    publishedAt: Schema.Attribute.DateTime;
    refund_amount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    refund_date: Schema.Attribute.DateTime;
    refund_reason: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInvoiceInvoice extends Struct.CollectionTypeSchema {
  collectionName: 'invoices';
  info: {
    description: 'Invoices for course purchases with itemized billing';
    displayName: 'Invoice';
    pluralName: 'invoices';
    singularName: 'invoice';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    applied_offers: Schema.Attribute.Relation<
      'manyToMany',
      'api::pricing-offer.pricing-offer'
    >;
    billing_address: Schema.Attribute.JSON;
    child_invoices: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice.invoice'
    >;
    course: Schema.Attribute.Relation<'manyToOne', 'api::course.course'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>;
    customer: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    discount_amount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    due_date: Schema.Attribute.DateTime;
    invoice_items: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice-item.invoice-item'
    >;
    invoice_number: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    invoice_status: Schema.Attribute.Enumeration<
      [
        'DRAFT',
        'PENDING',
        'PAID',
        'PARTIALLY_PAID',
        'OVERDUE',
        'CANCELLED',
        'REFUNDED',
      ]
    > &
      Schema.Attribute.DefaultTo<'DRAFT'>;
    invoice_type: Schema.Attribute.Enumeration<
      ['CONSUMER_INVOICE', 'PUBLISHER_INVOICE', 'ORG_INVOICE', 'REFUND_INVOICE']
    > &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice.invoice'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    paid_date: Schema.Attribute.DateTime;
    parent_invoice: Schema.Attribute.Relation<
      'manyToOne',
      'api::invoice.invoice'
    >;
    payment_terms: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Net 30'>;
    payments: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice-payment.invoice-payment'
    >;
    publishedAt: Schema.Attribute.DateTime;
    subtotal: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    tax_amount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    total_amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiKitKit extends Struct.CollectionTypeSchema {
  collectionName: 'kits';
  info: {
    displayName: 'kit';
    pluralName: 'kits';
    singularName: 'kit';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    access_notes: Schema.Attribute.Text;
    category_type: Schema.Attribute.Enumeration<
      [
        'AI',
        'DEVOPS',
        'DOCKER',
        'TESTING',
        'LEARNING',
        'SKILL',
        'PROJECT',
        'WEBAPP',
        'MOBILEAPP',
        'FRONTEND',
        'BACKEND',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    experience_level: Schema.Attribute.Enumeration<
      ['COLLEGE', 'PROFESSIONAL', 'SCHOOL']
    >;
    images: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    is_featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    kit_type: Schema.Attribute.Enumeration<['FREE', 'PAID', 'FREEMIUM']> &
      Schema.Attribute.DefaultTo<'FREE'>;
    kit_video: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    kitlevels: Schema.Attribute.Relation<'oneToMany', 'api::kitlevel.kitlevel'>;
    kitprogresses: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitprogress.kitprogress'
    >;
    kitsubscriptions: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitsubscription.kitsubscription'
    >;
    lessons: Schema.Attribute.Relation<'oneToMany', 'api::lesson.lesson'>;
    level: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::kit.kit'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    offers: Schema.Attribute.Relation<'manyToMany', 'api::offer.offer'>;
    orgs: Schema.Attribute.Relation<'manyToMany', 'api::org.org'>;
    pricing_plans: Schema.Attribute.Relation<
      'oneToMany',
      'api::pricing.pricing'
    >;
    publishedAt: Schema.Attribute.DateTime;
    quizzes: Schema.Attribute.Relation<'manyToMany', 'api::quiz.quiz'>;
    resources: Schema.Attribute.Relation<'oneToMany', 'api::resource.resource'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_repos: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-repo.user-repo'
    >;
    youtube_link: Schema.Attribute.String;
  };
}

export interface ApiKitlevelKitlevel extends Struct.CollectionTypeSchema {
  collectionName: 'kitlevels';
  info: {
    displayName: 'kitlevel';
    pluralName: 'kitlevels';
    singularName: 'kitlevel';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    is_free: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    kit: Schema.Attribute.Relation<'manyToOne', 'api::kit.kit'>;
    kitprogresses: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitprogress.kitprogress'
    >;
    kitsubscriptions: Schema.Attribute.Relation<
      'manyToMany',
      'api::kitsubscription.kitsubscription'
    >;
    lessons: Schema.Attribute.Relation<'oneToMany', 'api::lesson.lesson'>;
    level_video: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitlevel.kitlevel'
    > &
      Schema.Attribute.Private;
    order: Schema.Attribute.Integer;
    orgs: Schema.Attribute.Relation<'manyToMany', 'api::org.org'>;
    publishedAt: Schema.Attribute.DateTime;
    resources: Schema.Attribute.Relation<'oneToMany', 'api::resource.resource'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_level: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-level.user-level'
    >;
    youtube_link: Schema.Attribute.String;
  };
}

export interface ApiKitprogressKitprogress extends Struct.CollectionTypeSchema {
  collectionName: 'kitprogresses';
  info: {
    displayName: 'kitprogress';
    pluralName: 'kitprogresses';
    singularName: 'kitprogress';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    completed_at: Schema.Attribute.Date;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_active: Schema.Attribute.Boolean;
    kit: Schema.Attribute.Relation<'manyToOne', 'api::kit.kit'>;
    kit_status: Schema.Attribute.Enumeration<
      ['NOT_STARTED', 'INPROGRESS', 'COMPLETED', 'SKIPPED']
    > &
      Schema.Attribute.DefaultTo<'NOT_STARTED'>;
    kitlevel: Schema.Attribute.Relation<'manyToOne', 'api::kitlevel.kitlevel'>;
    last_accessed_at: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitprogress.kitprogress'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Blocks;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    progress: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    started_at: Schema.Attribute.Date;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiKitsubscriptionKitsubscription
  extends Struct.CollectionTypeSchema {
  collectionName: 'kitsubscriptions';
  info: {
    description: 'User kit subscriptions with payment tracking';
    displayName: 'kitsubscription';
    pluralName: 'kitsubscriptions';
    singularName: 'kitsubscription';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    amount_paid: Schema.Attribute.Decimal;
    auto_renew: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    cancellation_reason: Schema.Attribute.Text;
    cancelled_at: Schema.Attribute.DateTime;
    cashfree_order_id: Schema.Attribute.String;
    cashfree_subscription_id: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    enddate: Schema.Attribute.Date;
    grace_period_days: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    kit: Schema.Attribute.Relation<'manyToOne', 'api::kit.kit'>;
    last_payment_at: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitsubscription.kitsubscription'
    > &
      Schema.Attribute.Private;
    next_billing_date: Schema.Attribute.Date;
    notes: Schema.Attribute.Blocks;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    payment_method: Schema.Attribute.Enumeration<
      ['CARD', 'UPI', 'NETBANKING', 'WALLET', 'FREE', 'OTHER']
    >;
    payments: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-payment.user-payment'
    >;
    paymentstatus: Schema.Attribute.Enumeration<
      ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'FAILED']
    > &
      Schema.Attribute.DefaultTo<'PENDING'>;
    pricing: Schema.Attribute.Relation<'manyToOne', 'api::pricing.pricing'>;
    publishedAt: Schema.Attribute.DateTime;
    startdate: Schema.Attribute.Date;
    subscription_type: Schema.Attribute.Enumeration<
      ['FREE', 'PAID', 'FREEMIUM']
    >;
    transactionid: Schema.Attribute.String & Schema.Attribute.Unique;
    unlocked_lessons: Schema.Attribute.Relation<
      'manyToMany',
      'api::lesson.lesson'
    >;
    unlocked_levels: Schema.Attribute.Relation<
      'manyToMany',
      'api::kitlevel.kitlevel'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiLessonLesson extends Struct.CollectionTypeSchema {
  collectionName: 'lessons';
  info: {
    displayName: 'lesson';
    pluralName: 'lessons';
    singularName: 'lesson';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    duration: Schema.Attribute.String;
    is_free: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    kit: Schema.Attribute.Relation<'manyToOne', 'api::kit.kit'>;
    kitlevel: Schema.Attribute.Relation<'manyToOne', 'api::kitlevel.kitlevel'>;
    kitsubscriptions: Schema.Attribute.Relation<
      'manyToMany',
      'api::kitsubscription.kitsubscription'
    >;
    lesson_link: Schema.Attribute.Text;
    lesson_multimedia: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson.lesson'
    > &
      Schema.Attribute.Private;
    order: Schema.Attribute.Integer;
    orgs: Schema.Attribute.Relation<'manyToMany', 'api::org.org'>;
    publishedAt: Schema.Attribute.DateTime;
    resources: Schema.Attribute.Relation<'oneToMany', 'api::resource.resource'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_lesson: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-lesson.user-lesson'
    >;
  };
}

export interface ApiOfferOffer extends Struct.CollectionTypeSchema {
  collectionName: 'offers';
  info: {
    description: 'Promotional offers and discounts for kits';
    displayName: 'Offer';
    pluralName: 'offers';
    singularName: 'offer';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    discount_type: Schema.Attribute.Enumeration<['PERCENTAGE', 'FIXED']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'PERCENTAGE'>;
    discount_value: Schema.Attribute.Decimal & Schema.Attribute.Required;
    end_date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    kits: Schema.Attribute.Relation<'manyToMany', 'api::kit.kit'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::offer.offer'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pricings: Schema.Attribute.Relation<'manyToMany', 'api::pricing.pricing'>;
    publishedAt: Schema.Attribute.DateTime;
    start_date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiOrgMetadataOrgMetadata extends Struct.CollectionTypeSchema {
  collectionName: 'org_metadatas';
  info: {
    displayName: 'org-metadata';
    pluralName: 'org-metadatas';
    singularName: 'org-metadata';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    docker_token: Schema.Attribute.Text;
    docker_username: Schema.Attribute.String;
    github_token: Schema.Attribute.Text;
    github_username: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::org-metadata.org-metadata'
    > &
      Schema.Attribute.Private;
    org: Schema.Attribute.Relation<'oneToOne', 'api::org.org'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    vercel_token: Schema.Attribute.Text;
  };
}

export interface ApiOrgOrg extends Struct.CollectionTypeSchema {
  collectionName: 'orgs';
  info: {
    displayName: 'org';
    pluralName: 'orgs';
    singularName: 'org';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.Relation<'oneToOne', 'api::address.address'>;
    calander_activities: Schema.Attribute.Relation<
      'manyToMany',
      'api::calander-activity.calander-activity'
    >;
    contact_email: Schema.Attribute.Email;
    contact_phone: Schema.Attribute.BigInteger;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Blocks;
    kitlevels: Schema.Attribute.Relation<
      'manyToMany',
      'api::kitlevel.kitlevel'
    >;
    kitprogresses: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitprogress.kitprogress'
    >;
    kits: Schema.Attribute.Relation<'manyToMany', 'api::kit.kit'>;
    kitsubscriptions: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitsubscription.kitsubscription'
    >;
    lessons: Schema.Attribute.Relation<'manyToMany', 'api::lesson.lesson'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::org.org'> &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    org_metadatum: Schema.Attribute.Relation<
      'oneToOne',
      'api::org-metadata.org-metadata'
    >;
    org_name: Schema.Attribute.String;
    org_status: Schema.Attribute.Enumeration<['ACTIVE', 'INACTIVE']> &
      Schema.Attribute.DefaultTo<'ACTIVE'>;
    pricings: Schema.Attribute.Relation<'manyToMany', 'api::pricing.pricing'>;
    publishedAt: Schema.Attribute.DateTime;
    teams: Schema.Attribute.Relation<'oneToMany', 'api::team.team'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_levels: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-level.user-level'
    >;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    usersubscriptions: Schema.Attribute.Relation<
      'oneToMany',
      'api::usersubscription.usersubscription'
    >;
  };
}

export interface ApiPricingOfferPricingOffer
  extends Struct.CollectionTypeSchema {
  collectionName: 'pricing_offers';
  info: {
    description: 'Multi-level offers: Publisher, Org, Special offers with priority system';
    displayName: 'Pricing Offer';
    pluralName: 'pricing-offers';
    singularName: 'pricing-offer';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    applicable_to: Schema.Attribute.Enumeration<
      [
        'ALL_COURSES',
        'SPECIFIC_COURSES',
        'SPECIFIC_SUBJECTS',
        'PUBLISHER_COURSES',
        'CATEGORY_COURSES',
      ]
    > &
      Schema.Attribute.DefaultTo<'ALL_COURSES'>;
    auto_apply: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    created_by: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    current_usage_count: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    description: Schema.Attribute.Text;
    discount_type: Schema.Attribute.Enumeration<
      ['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'TIERED']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'PERCENTAGE'>;
    discount_value: Schema.Attribute.Decimal & Schema.Attribute.Required;
    end_date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::pricing-offer.pricing-offer'
    > &
      Schema.Attribute.Private;
    max_usage_per_user: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<1>;
    min_purchase_amount: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    offer_code: Schema.Attribute.String & Schema.Attribute.Unique;
    offer_type: Schema.Attribute.Enumeration<
      [
        'PUBLISHER_OFFER',
        'ORG_LEVEL_OFFER',
        'SPECIAL_OFFER',
        'SEASONAL_OFFER',
        'BULK_DISCOUNT',
        'FIRST_TIME_USER',
      ]
    > &
      Schema.Attribute.Required;
    priority: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 10;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    publishedAt: Schema.Attribute.DateTime;
    stackable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    start_date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    target_categories: Schema.Attribute.JSON;
    target_courses: Schema.Attribute.Relation<
      'manyToMany',
      'api::course.course'
    >;
    target_orgs: Schema.Attribute.Relation<'manyToMany', 'api::org.org'>;
    target_publisher: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    target_subjects: Schema.Attribute.Relation<
      'manyToMany',
      'api::subject.subject'
    >;
    total_usage_limit: Schema.Attribute.Integer;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPricingPricing extends Struct.CollectionTypeSchema {
  collectionName: 'pricings';
  info: {
    description: 'Pricing plans for kits with discount support';
    displayName: 'pricing';
    pluralName: 'pricings';
    singularName: 'pricing';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    cashfree_plan_id: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>;
    description: Schema.Attribute.Blocks;
    discount_percent: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    discount_valid_until: Schema.Attribute.DateTime;
    duration: Schema.Attribute.Integer;
    features: Schema.Attribute.JSON;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    is_featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    kit: Schema.Attribute.Relation<'manyToOne', 'api::kit.kit'>;
    kitsubscriptions: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitsubscription.kitsubscription'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::pricing.pricing'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    offers: Schema.Attribute.Relation<'manyToMany', 'api::offer.offer'>;
    option: Schema.Attribute.Enumeration<
      [
        'ONETIME',
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'YEARLY',
        'ORG',
        'SPECIALORG',
        'SOCIETY',
      ]
    > &
      Schema.Attribute.DefaultTo<'ONETIME'>;
    orgs: Schema.Attribute.Relation<'manyToMany', 'api::org.org'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usersubscriptions: Schema.Attribute.Relation<
      'oneToMany',
      'api::usersubscription.usersubscription'
    >;
  };
}

export interface ApiQuestionQuestion extends Struct.CollectionTypeSchema {
  collectionName: 'questions';
  info: {
    description: 'Dynamic questions supporting multiple types and media';
    displayName: 'Question';
    pluralName: 'questions';
    singularName: 'question';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    caseSensitive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    chapter: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    creator: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    difficulty: Schema.Attribute.Enumeration<['easy', 'medium', 'hard']> &
      Schema.Attribute.DefaultTo<'medium'>;
    explanation: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    hints: Schema.Attribute.JSON;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    learningObjective: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    level: Schema.Attribute.Integer &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::question.question'
    >;
    metadata: Schema.Attribute.JSON;
    options: Schema.Attribute.JSON;
    order: Schema.Attribute.Integer;
    partialCredit: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    points: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    publishedAt: Schema.Attribute.DateTime;
    questionAudio: Schema.Attribute.Media;
    questionImage: Schema.Attribute.Media;
    questionText: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    questionType: Schema.Attribute.Enumeration<
      [
        'SC',
        'MCQ',
        'TF',
        'FillInBlank',
        'Match',
        'DragDrop',
        'Ordering',
        'Hotspot',
        'Audio',
      ]
    > &
      Schema.Attribute.DefaultTo<'SC'>;
    questionVideo: Schema.Attribute.Media;
    quizzes: Schema.Attribute.Relation<'manyToMany', 'api::quiz.quiz'>;
    shuffleOptions: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    statistics: Schema.Attribute.JSON;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    tag_exams: Schema.Attribute.Relation<
      'manyToMany',
      'api::tag-exam.tag-exam'
    >;
    tag_years: Schema.Attribute.Relation<
      'manyToMany',
      'api::tag-year.tag-year'
    >;
    tags: Schema.Attribute.JSON;
    timeLimit: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 600;
          min: 5;
        },
        number
      >;
    topic: Schema.Attribute.Relation<'manyToOne', 'api::topic.topic'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    version: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
  };
}

export interface ApiQuizResultQuizResult extends Struct.CollectionTypeSchema {
  collectionName: 'quiz_results';
  info: {
    description: 'Stores user quiz attempts and scores';
    displayName: 'Quiz Result';
    pluralName: 'quiz-results';
    singularName: 'quiz-result';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    answers: Schema.Attribute.JSON;
    completedAt: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::quiz-result.quiz-result'
    > &
      Schema.Attribute.Private;
    percentage: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    questionTimings: Schema.Attribute.JSON;
    quiz: Schema.Attribute.Relation<'manyToOne', 'api::quiz.quiz'>;
    score: Schema.Attribute.Integer & Schema.Attribute.Required;
    startedAt: Schema.Attribute.DateTime;
    student: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    timeTaken: Schema.Attribute.Integer;
    topic: Schema.Attribute.Relation<'manyToOne', 'api::topic.topic'>;
    totalQuestions: Schema.Attribute.Integer & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuizQuiz extends Struct.CollectionTypeSchema {
  collectionName: 'quizzes';
  info: {
    description: 'Dynamic quiz system for educational content';
    displayName: 'Quiz';
    pluralName: 'quizzes';
    singularName: 'quiz';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    allowReview: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    category: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    certificate: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    creator: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    description: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    difficulty: Schema.Attribute.Enumeration<
      ['beginner', 'intermediate', 'advanced']
    > &
      Schema.Attribute.DefaultTo<'beginner'>;
    estimatedDuration: Schema.Attribute.Integer;
    instructions: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isRandomized: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    kits: Schema.Attribute.Relation<'manyToMany', 'api::kit.kit'>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::quiz.quiz'>;
    maxAttempts: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 10;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    passingScore: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<70>;
    prerequisites: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    questions: Schema.Attribute.Relation<
      'manyToMany',
      'api::question.question'
    >;
    quizResults: Schema.Attribute.Relation<
      'oneToMany',
      'api::quiz-result.quiz-result'
    >;
    quizType: Schema.Attribute.Enumeration<
      ['standalone', 'kit', 'level', 'lesson']
    > &
      Schema.Attribute.DefaultTo<'standalone'>;
    relatedType: Schema.Attribute.String;
    results: Schema.Attribute.Relation<
      'oneToMany',
      'api::quiz-result.quiz-result'
    >;
    showCorrectAnswers: Schema.Attribute.Enumeration<
      ['immediately', 'after-submission', 'never']
    > &
      Schema.Attribute.DefaultTo<'after-submission'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    tags: Schema.Attribute.JSON;
    timeLimit: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 300;
          min: 1;
        },
        number
      >;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    topic: Schema.Attribute.Relation<'manyToOne', 'api::topic.topic'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiResourceResource extends Struct.CollectionTypeSchema {
  collectionName: 'resources';
  info: {
    displayName: 'resource';
    pluralName: 'resources';
    singularName: 'resource';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    kit: Schema.Attribute.Relation<'manyToOne', 'api::kit.kit'>;
    kitlevel: Schema.Attribute.Relation<'manyToOne', 'api::kitlevel.kitlevel'>;
    lesson: Schema.Attribute.Relation<'manyToOne', 'api::lesson.lesson'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::resource.resource'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resource_packages: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    resource_type: Schema.Attribute.Enumeration<
      ['PDF', 'VIDEO', 'CODE', 'FILE']
    >;
    resource_url: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSubjectPricingSubjectPricing
  extends Struct.CollectionTypeSchema {
  collectionName: 'subject_pricings';
  info: {
    description: 'Individual pricing for subjects within courses';
    displayName: 'Subject Pricing';
    pluralName: 'subject-pricings';
    singularName: 'subject-pricing';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    base_amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    complexity_multiplier: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0.1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    content_count_multiplier: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0.1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    course_pricing: Schema.Attribute.Relation<
      'manyToOne',
      'api::course-pricing.course-pricing'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::subject-pricing.subject-pricing'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    platform_commission_percent: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<30>;
    publishedAt: Schema.Attribute.DateTime;
    publisher: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publisher_commission_percent: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<70>;
    subject: Schema.Attribute.Relation<'oneToOne', 'api::subject.subject'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSubjectSubject extends Struct.CollectionTypeSchema {
  collectionName: 'subjects';
  info: {
    displayName: 'subject';
    pluralName: 'subjects';
    singularName: 'subject';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    approver: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    authoredBy: Schema.Attribute.Relation<
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    contents: Schema.Attribute.Relation<'manyToMany', 'api::content.content'>;
    courses: Schema.Attribute.Relation<'manyToMany', 'api::course.course'>;
    coverpage: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    grade: Schema.Attribute.Enumeration<
      [
        'PLAYSCHOOL',
        'LKG',
        'UKG',
        'FIRST',
        'SECOND',
        'THIRD',
        'FOURTH',
        'FIFTH',
        'SIXTH',
        'SEVENTH',
        'EIGHTH',
        'NINTH',
        'TENTH',
        'ELEVENTH',
        'TWELFTH',
        'DIPLOMA',
        'GRADUATION',
        'POSTGRADUATION',
        'PHD',
      ]
    >;
    level: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::subject.subject'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    publishers: Schema.Attribute.Relation<
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    questions: Schema.Attribute.Relation<'oneToMany', 'api::question.question'>;
    quiz_results: Schema.Attribute.Relation<
      'oneToMany',
      'api::quiz-result.quiz-result'
    >;
    quizResults: Schema.Attribute.Relation<
      'oneToMany',
      'api::quiz-result.quiz-result'
    >;
    quizzes: Schema.Attribute.Relation<'oneToMany', 'api::quiz.quiz'>;
    topics: Schema.Attribute.Relation<'oneToMany', 'api::topic.topic'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usersubscription: Schema.Attribute.Relation<
      'manyToOne',
      'api::usersubscription.usersubscription'
    >;
  };
}

export interface ApiTagExamTagExam extends Struct.CollectionTypeSchema {
  collectionName: 'tag_exams';
  info: {
    displayName: 'tag_exam';
    pluralName: 'tag-exams';
    singularName: 'tag-exam';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::tag-exam.tag-exam'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    questions: Schema.Attribute.Relation<
      'manyToMany',
      'api::question.question'
    >;
    tag_exam: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTagYearTagYear extends Struct.CollectionTypeSchema {
  collectionName: 'tag_years';
  info: {
    displayName: 'tag_year';
    pluralName: 'tag-years';
    singularName: 'tag-year';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::tag-year.tag-year'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    questions: Schema.Attribute.Relation<
      'manyToMany',
      'api::question.question'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    year: Schema.Attribute.Integer;
  };
}

export interface ApiTeamTeam extends Struct.CollectionTypeSchema {
  collectionName: 'teams';
  info: {
    displayName: 'team';
    pluralName: 'teams';
    singularName: 'team';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      ['sanskar', 'gyan', 'dharm', 'soch', 'academic', 'sport']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::team.team'> &
      Schema.Attribute.Private;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    players: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTopicTopic extends Struct.CollectionTypeSchema {
  collectionName: 'topics';
  info: {
    displayName: 'topic';
    pluralName: 'topics';
    singularName: 'topic';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    contents: Schema.Attribute.Relation<'oneToMany', 'api::content.content'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::topic.topic'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    questions: Schema.Attribute.Relation<'oneToMany', 'api::question.question'>;
    quiz_results: Schema.Attribute.Relation<
      'oneToMany',
      'api::quiz-result.quiz-result'
    >;
    quizResults: Schema.Attribute.Relation<
      'oneToMany',
      'api::quiz-result.quiz-result'
    >;
    quizzes: Schema.Attribute.Relation<'oneToMany', 'api::quiz.quiz'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUserExperienceUserExperience
  extends Struct.CollectionTypeSchema {
  collectionName: 'user_experiences';
  info: {
    displayName: 'user-experience';
    pluralName: 'user-experiences';
    singularName: 'user-experience';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    experience_type: Schema.Attribute.Enumeration<
      ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-experience.user-experience'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUserLessonUserLesson extends Struct.CollectionTypeSchema {
  collectionName: 'user_lessons';
  info: {
    displayName: 'user-lesson';
    pluralName: 'user-lessons';
    singularName: 'user-lesson';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    is_completed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    is_locked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lesson: Schema.Attribute.Relation<'oneToOne', 'api::lesson.lesson'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-lesson.user-lesson'
    > &
      Schema.Attribute.Private;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    progress: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiUserLevelUserLevel extends Struct.CollectionTypeSchema {
  collectionName: 'user_levels';
  info: {
    displayName: 'user-level';
    pluralName: 'user-levels';
    singularName: 'user-level';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    is_completed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    is_locked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    kitlevel: Schema.Attribute.Relation<'oneToOne', 'api::kitlevel.kitlevel'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-level.user-level'
    > &
      Schema.Attribute.Private;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    progress: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiUserMetadataUserMetadata
  extends Struct.CollectionTypeSchema {
  collectionName: 'user_metadatas';
  info: {
    displayName: 'user-metadata';
    pluralName: 'user-metadatas';
    singularName: 'user-metadata';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    docker_token: Schema.Attribute.String;
    docker_username: Schema.Attribute.String;
    github_token: Schema.Attribute.Text;
    github_username: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-metadata.user-metadata'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiUserPaymentUserPayment extends Struct.CollectionTypeSchema {
  collectionName: 'user_payments';
  info: {
    description: 'Payment transaction records for kit subscriptions';
    displayName: 'User Payment';
    pluralName: 'user-payments';
    singularName: 'user-payment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    cashfree_order_id: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    cashfree_payment_id: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>;
    customer_email: Schema.Attribute.String;
    customer_name: Schema.Attribute.String;
    customer_phone: Schema.Attribute.String;
    kit: Schema.Attribute.Relation<'manyToOne', 'api::kit.kit'>;
    kit_name: Schema.Attribute.String;
    kitsubscription: Schema.Attribute.Relation<
      'manyToOne',
      'api::kitsubscription.kitsubscription'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-payment.user-payment'
    > &
      Schema.Attribute.Private;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    payment_gateway_response: Schema.Attribute.JSON;
    payment_method: Schema.Attribute.String;
    payment_status: Schema.Attribute.Enumeration<
      ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED']
    > &
      Schema.Attribute.DefaultTo<'PENDING'>;
    pricing: Schema.Attribute.Relation<'manyToOne', 'api::pricing.pricing'>;
    pricing_name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    transaction_date: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    webhook_data: Schema.Attribute.JSON;
  };
}

export interface ApiUserRepoUserRepo extends Struct.CollectionTypeSchema {
  collectionName: 'user_repos';
  info: {
    displayName: 'user-repo';
    pluralName: 'user-repos';
    singularName: 'user-repo';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    kit: Schema.Attribute.Relation<'manyToOne', 'api::kit.kit'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-repo.user-repo'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    repo_url: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    user_repo_name: Schema.Attribute.String;
  };
}

export interface ApiUserroleUserrole extends Struct.CollectionTypeSchema {
  collectionName: 'userroles';
  info: {
    displayName: 'userrole';
    pluralName: 'userroles';
    singularName: 'userrole';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    enddate: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::userrole.userrole'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    startdate: Schema.Attribute.Date;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiUsersubscriptionUsersubscription
  extends Struct.CollectionTypeSchema {
  collectionName: 'usersubscriptions';
  info: {
    displayName: 'usersubscription';
    pluralName: 'usersubscriptions';
    singularName: 'usersubscription';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    amount_paid: Schema.Attribute.Decimal;
    auto_renew: Schema.Attribute.Boolean;
    cancellation_reason: Schema.Attribute.String;
    cancelled_at: Schema.Attribute.Date;
    cashfree_order_id: Schema.Attribute.String;
    cashfree_subscription_id: Schema.Attribute.String;
    course: Schema.Attribute.Relation<'manyToOne', 'api::course.course'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    enddate: Schema.Attribute.Date;
    grace_period_days: Schema.Attribute.Integer;
    last_payment_at: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::usersubscription.usersubscription'
    > &
      Schema.Attribute.Private;
    next_billing_date: Schema.Attribute.Date;
    notes: Schema.Attribute.Blocks;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    payment_method: Schema.Attribute.Enumeration<
      ['CARD', 'UPI', 'NETBANKING', 'CASH', 'OTHER']
    >;
    paymentstatus: Schema.Attribute.Enumeration<
      ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'FAILED']
    >;
    pricing: Schema.Attribute.Relation<'manyToOne', 'api::pricing.pricing'>;
    publishedAt: Schema.Attribute.DateTime;
    startdate: Schema.Attribute.Date;
    subjects: Schema.Attribute.Relation<'oneToMany', 'api::subject.subject'>;
    subscription_type: Schema.Attribute.Enumeration<
      ['FREEMIUM', 'FREE', 'PAID', 'TRIAL']
    >;
    transactionid: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users_permissions_user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    age: Schema.Attribute.Integer;
    approved_subjects: Schema.Attribute.Relation<
      'oneToMany',
      'api::subject.subject'
    >;
    authored_subjects: Schema.Attribute.Relation<
      'manyToMany',
      'api::subject.subject'
    >;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    calander_activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::calander-activity.calander-activity'
    >;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dob: Schema.Attribute.Date;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    first_name: Schema.Attribute.String;
    gender: Schema.Attribute.Enumeration<['MALE', 'FEMALE']>;
    getstarted_completed: Schema.Attribute.Boolean;
    home_address: Schema.Attribute.Relation<'oneToOne', 'api::address.address'>;
    kitprogresses: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitprogress.kitprogress'
    >;
    kitsubscriptions: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitsubscription.kitsubscription'
    >;
    last_name: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    mobile_number: Schema.Attribute.BigInteger;
    org: Schema.Attribute.Relation<'manyToOne', 'api::org.org'>;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    privacy_accepted: Schema.Attribute.Boolean;
    profile_photo: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    profile_picture: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    provider: Schema.Attribute.String;
    published_courses: Schema.Attribute.Relation<
      'oneToMany',
      'api::course.course'
    >;
    published_subjects: Schema.Attribute.Relation<
      'manyToMany',
      'api::subject.subject'
    >;
    publishedAt: Schema.Attribute.DateTime;
    quiz_results: Schema.Attribute.Relation<
      'oneToMany',
      'api::quiz-result.quiz-result'
    >;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    team: Schema.Attribute.Relation<'manyToOne', 'api::team.team'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_experience_level: Schema.Attribute.Enumeration<
      ['SCHOOL', 'COLLEGE', 'PROFESSIONAL']
    >;
    user_lessons: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-lesson.user-lesson'
    >;
    user_levels: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-level.user-level'
    >;
    user_metadatum: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-metadata.user-metadata'
    >;
    user_permissions: Schema.Attribute.JSON;
    user_repos: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-repo.user-repo'
    >;
    user_role: Schema.Attribute.Enumeration<
      ['STUDENT', 'TEACHER', 'PARENT', 'MARKETING', 'ADMIN', 'SUPERADMIN']
    >;
    user_roles: Schema.Attribute.JSON;
    user_status: Schema.Attribute.Enumeration<
      ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED']
    >;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    userroles: Schema.Attribute.Relation<'oneToMany', 'api::userrole.userrole'>;
    usersubscriptions: Schema.Attribute.Relation<
      'oneToMany',
      'api::usersubscription.usersubscription'
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::address.address': ApiAddressAddress;
      'api::calander-activity.calander-activity': ApiCalanderActivityCalanderActivity;
      'api::content.content': ApiContentContent;
      'api::course-pricing.course-pricing': ApiCoursePricingCoursePricing;
      'api::course.course': ApiCourseCourse;
      'api::customuser.custom-user': ApiCustomuserCustomUser;
      'api::invoice-item.invoice-item': ApiInvoiceItemInvoiceItem;
      'api::invoice-payment.invoice-payment': ApiInvoicePaymentInvoicePayment;
      'api::invoice.invoice': ApiInvoiceInvoice;
      'api::kit.kit': ApiKitKit;
      'api::kitlevel.kitlevel': ApiKitlevelKitlevel;
      'api::kitprogress.kitprogress': ApiKitprogressKitprogress;
      'api::kitsubscription.kitsubscription': ApiKitsubscriptionKitsubscription;
      'api::lesson.lesson': ApiLessonLesson;
      'api::offer.offer': ApiOfferOffer;
      'api::org-metadata.org-metadata': ApiOrgMetadataOrgMetadata;
      'api::org.org': ApiOrgOrg;
      'api::pricing-offer.pricing-offer': ApiPricingOfferPricingOffer;
      'api::pricing.pricing': ApiPricingPricing;
      'api::question.question': ApiQuestionQuestion;
      'api::quiz-result.quiz-result': ApiQuizResultQuizResult;
      'api::quiz.quiz': ApiQuizQuiz;
      'api::resource.resource': ApiResourceResource;
      'api::subject-pricing.subject-pricing': ApiSubjectPricingSubjectPricing;
      'api::subject.subject': ApiSubjectSubject;
      'api::tag-exam.tag-exam': ApiTagExamTagExam;
      'api::tag-year.tag-year': ApiTagYearTagYear;
      'api::team.team': ApiTeamTeam;
      'api::topic.topic': ApiTopicTopic;
      'api::user-experience.user-experience': ApiUserExperienceUserExperience;
      'api::user-lesson.user-lesson': ApiUserLessonUserLesson;
      'api::user-level.user-level': ApiUserLevelUserLevel;
      'api::user-metadata.user-metadata': ApiUserMetadataUserMetadata;
      'api::user-payment.user-payment': ApiUserPaymentUserPayment;
      'api::user-repo.user-repo': ApiUserRepoUserRepo;
      'api::userrole.userrole': ApiUserroleUserrole;
      'api::usersubscription.usersubscription': ApiUsersubscriptionUsersubscription;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
