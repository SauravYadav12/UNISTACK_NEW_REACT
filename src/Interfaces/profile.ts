export interface UserProfile extends MyDocuments {
  _id: string;
  employeeId:string
  user: string;
  name?: string;
  photo: string;
  email: ProfileEmail;
  dob: string;
  phoneNumber: string;
  emergencyPhoneNumber: string;
  panNumber: string;
  aadharNumber: string;
  bankDetails: BankDetails;
  communicationAddress: CommunicationAddress;
  permanentAddress: PermanentAddress;
  // Auto-stamped by the server on first activation (false→true). Used
  // as the anchor for the 3-month probation window and leave prorata.
  // Admins can edit manually if the recorded date differs from the
  // actual onboarding date.
  dateOfJoining?: string;
  // Auto-stamped by the server on deactivation (true→false). Cleared
  // when the user is reactivated. Surfaced on the profile so HR can
  // see the relieving date at a glance.
  relievingDate?: string;
}

export interface MyDocuments {
  panCopy: string;
  aadharCopy: string;
  resume: string;
}

export type CommunicationAddress = Address;
export type PermanentAddress = Address;
interface Address {
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  'zip/pin': string;
}
export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  swiftCode: string;
  bankAddress: string;
}

export interface ProfileEmail {
  personal: string;
  official: string;
}

type IsObject<T> = T extends object ? (T extends unknown[] ? false : true) : false;

type ObjectKeys<T> = {
  [K in keyof T]: T[K] extends object
    ? IsObject<T[K]> extends true
      ? K | ObjectKeys<T[K]>
      : never
    : never;
}[keyof T];

type AllKeys<T, Parent extends string = never> = T extends object
  ? {
      [K in keyof T]: K extends string
        ?
            | Parent
            | K
            | (T[K] extends object
                ? IsObject<T[K]> extends true
                  ? AllKeys<T[K], K>
                  : never
                : never)
        : never;
    }[keyof T]
  : never;

type PrimitiveFields<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object
        ? IsObject<T[K]> extends true
          ? PrimitiveFields<T[K]>
          : K
        : K;
    }[keyof T]
  : never;

type TopLevelPrimitiveFields<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object
        ? IsObject<T[K]> extends false
          ? K
          : never
        : K;
    }[keyof T]
  : never;

export type UserProfilePrimitiveFields = PrimitiveFields<
  Omit<UserProfile, '_id'>
>;
export type UserProfileTopLevelPrimitiveFields = TopLevelPrimitiveFields<
  Omit<UserProfile, '_id'>
>;
export type UserProfileAllKeys = AllKeys<Omit<UserProfile, '_id'>>;
export type UserProfileParentFields = ObjectKeys<Omit<UserProfile, '_id'>>;

export interface MyDetail {
  label: string;
  value?: string;
}
