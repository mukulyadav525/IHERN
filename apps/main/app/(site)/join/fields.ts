/** The membership form's values and result (shared by the form and its server action). */

export type JoinFields = {
  title: string;
  studentName: string;
  studentEmail: string;
  studentMobile: string;
  institutionName: string;
  areasofinterest: string;
  yourTitle: string;
  anyothervalue: string;
  areasofinteresthe: string;
  url: string;
};

export type JoinState = {
  seq: number;
  errors: string[];
  old: JoinFields;
  done: { name: string; email: string; number: string; mailed: boolean } | null;
};

export const EMPTY_FIELDS: JoinFields = {
  title: "", studentName: "", studentEmail: "", studentMobile: "", institutionName: "", areasofinterest: "",
  yourTitle: "", anyothervalue: "", areasofinteresthe: "", url: "",
};
