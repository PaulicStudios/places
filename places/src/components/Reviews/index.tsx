"use server";

import { saveReview } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ReviewSubmit(formData: FormData) {
  const product_code = formData.get("id") as string;
  const name = formData.get("name") as string;
  let description = formData.get("description") as string;
  let stars = parseInt(formData.get("stars") as string) || 0;

  if (!description || description.trim().length === 0) {
    description = "No description was provided!";
  }

  if (stars < 1 || stars > 5) {
    if (stars < 1)
      stars = 1;
    if (stars > 5)
      stars = 5;
  }

  try {
    saveReview({
      product_code,
      name,
      description,
      stars
    });
    return redirect(`/you got rickrolled`); //TODO: Where to redirect @Flo
  } catch (err) {
    console.log(`Error in reviewSubmit: ${err}`);
    return { error: "Failed to save review" };
  }
}
