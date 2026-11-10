import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const seat = v.union(v.literal("open"), v.literal("few"), v.literal("full"));

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    photo: v.optional(v.string()),
    onboarded: v.boolean(),
    homePlace: v.optional(v.string()),
    schoolPlace: v.optional(v.string()),
    classTime: v.string(),
    notifyRush: v.boolean(),
    notifyWeather: v.boolean(),
    notifyDelay: v.boolean(),
    // legacy field: distances are always km
    units: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  places: defineTable({
    slug: v.string(),
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    // notable, common pickup spots in this place, as meters along the route from its stop
    landmarks: v.optional(v.array(v.object({ name: v.string(), offsetM: v.number() }))),
  }).index("by_slug", ["slug"]),

  routes: defineTable({
    slug: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("jeepney"),
      v.literal("modern_jeepney"),
      v.literal("bus"),
      v.literal("tricycle"),
    ),
    fare: v.number(),
    geometry: v.array(v.array(v.number())), // [lng, lat]
    cum: v.array(v.number()), // cumulative meters per vertex
    // named roadside pickup spots along the route, as meters from its start
    pickups: v.optional(v.array(v.object({ name: v.string(), at: v.number() }))),
    stops: v.array(
      v.object({
        slug: v.string(),
        name: v.string(),
        lat: v.number(),
        lng: v.number(),
        at: v.number(), // meters along route
      }),
    ),
  }).index("by_slug", ["slug"]),

  vehicles: defineTable({
    routeId: v.id("routes"),
    label: v.string(),
    progress: v.number(), // meters along route
    dir: v.union(v.literal(1), v.literal(-1)),
    speed: v.number(), // m/s
    seat,
    seatSetBy: v.union(v.literal("driver"), v.literal("student")),
  }).index("by_route", ["routeId"]),

  reports: defineTable({
    kind: v.union(
      v.literal("roadworks"),
      v.literal("accident"),
      v.literal("traffic"),
      v.literal("flood"),
    ),
    delayMin: v.number(),
    routeId: v.optional(v.id("routes")),
    lat: v.number(),
    lng: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
    authorName: v.string(),
  }).index("by_expiry", ["expiresAt"]),

  alerts: defineTable({
    userId: v.id("users"),
    kind: v.union(v.literal("rush"), v.literal("weather"), v.literal("delay"), v.literal("arrival")),
    title: v.string(),
    body: v.string(),
    createdAt: v.number(),
    read: v.boolean(),
  }).index("by_user", ["userId"]),

  geofences: defineTable({
    userId: v.id("users"),
    vehicleId: v.id("vehicles"),
    routeId: v.id("routes"),
    dir: v.union(v.literal(1), v.literal(-1)), // travel direction the user is waiting for
    lng: v.number(),
    lat: v.number(),
    radiusM: v.number(),
    inside: v.boolean(),
    status: v.union(v.literal("active"), v.literal("triggered"), v.literal("cancelled")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),
});
