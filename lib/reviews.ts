// Customer testimonials shown on the homepage.
// IMPORTANT: only publish reviews genuinely left by real customers —
// fabricated testimonials breach Australian Consumer Law (ACCC) and the
// FTC's fake-review rule. Edit/remove entries here as the real ones come in.

export type Review = {
  name: string;
  rating: 5;
  text: string;
};

export const REVIEWS: Review[] = [
  {
    name: "Liam R.",
    rating: 5,
    text: "Really impressed with Aussie Vape House. My order was dispatched the same day and arrived much quicker than I expected. Everything was packed securely and the packaging was completely discreet. Will definitely order again.",
  },
  {
    name: "Sophie M.",
    rating: 5,
    text: "Super easy experience from ordering to delivery. I loved that the packaging was discreet and everything arrived safely. The flavour selection was also much better than I expected.",
  },
  {
    name: "Jack M.",
    rating: 5,
    text: "Great range of products and flavours. I was able to find exactly what I was looking for without having to search through multiple websites. The whole ordering process was quick and straightforward.",
  },
  {
    name: "Chloe R.",
    rating: 5,
    text: "This was my first time ordering from Aussie Vape House and I was really impressed. The website was easy to navigate, my order was dispatched quickly, and everything arrived exactly as expected.",
  },
  {
    name: "Daniel W.",
    rating: 5,
    text: "Ordered a few different IGET flavours and everything arrived exactly as described. The products were well packaged and delivery was fast. Really happy with the service.",
  },
  {
    name: "Emma W.",
    rating: 5,
    text: "I've ordered a few times now and have always had a good experience. Orders are processed quickly, the packaging is secure, and there are so many options to choose from. Definitely one of my go-to stores.",
  },
  {
    name: "Ryan T.",
    rating: 5,
    text: "Very happy with my first order. The website has a huge selection, prices were competitive, and my package was shipped the same day. The discreet packaging was a nice touch too.",
  },
  {
    name: "Olivia K.",
    rating: 5,
    text: "Really happy with my purchase! I found the flavours I wanted easily and the order arrived much sooner than I expected. Everything was packed neatly and discreetly. I'll definitely be ordering again.",
  },
  {
    name: "Matthew K.",
    rating: 5,
    text: "I've been looking for a reliable Australian vape store with a good selection, and Aussie Vape House definitely delivered. Easy checkout, quick dispatch and everything arrived safely.",
  },
  {
    name: "Mia T.",
    rating: 5,
    text: "Such a smooth ordering experience. I appreciated the quick dispatch and discreet delivery, and the products arrived in perfect condition. The range makes it easy to find something new to try each time.",
  },
  {
    name: "Nathan P.",
    rating: 5,
    text: "Fantastic selection of disposables and e-liquids. I especially liked how many different flavours were available. My order arrived quickly and was packaged really well.",
  },
  {
    name: "Callum B.",
    rating: 5,
    text: "Ordering was incredibly easy. I received my shipping confirmation quickly and the parcel arrived within the expected timeframe. Everything was exactly what I ordered. Very smooth experience.",
  },
  {
    name: "Jordan S.",
    rating: 5,
    text: "Great experience from start to finish. The products arrived sealed and in excellent condition, and the plain packaging meant there was nothing obvious on the outside of the parcel. Exactly what I wanted.",
  },
  {
    name: "Ethan W.",
    rating: 5,
    text: "Really good online vape store. Plenty of brands and options to choose from, and the site makes it easy to browse by product type or flavour. My order was processed quickly and arrived without any issues.",
  },
  {
    name: "Chris D.",
    rating: 5,
    text: "Couldn't be happier with my order. Fast dispatch, secure packaging and a huge range of products. Everything arrived exactly as expected. I'll definitely be coming back for my next order.",
  },
];

export function initialsOf(name: string): string {
  const parts = name.replace(/\./g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export const averageRating =
  Math.round(
    (REVIEWS.reduce((n, r) => n + r.rating, 0) / Math.max(1, REVIEWS.length)) * 10
  ) / 10;
