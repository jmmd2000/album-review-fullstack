/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as AlbumsIndexImport } from './routes/albums/index'
import { Route as AlbumsAlbumIDIndexImport } from './routes/albums/$albumID/index'
import { Route as AlbumsAlbumIDEditImport } from './routes/albums/$albumID/edit'
import { Route as AlbumsAlbumIDCreateImport } from './routes/albums/$albumID/create'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const AlbumsIndexRoute = AlbumsIndexImport.update({
  id: '/albums/',
  path: '/albums/',
  getParentRoute: () => rootRoute,
} as any)

const AlbumsAlbumIDIndexRoute = AlbumsAlbumIDIndexImport.update({
  id: '/albums/$albumID/',
  path: '/albums/$albumID/',
  getParentRoute: () => rootRoute,
} as any)

const AlbumsAlbumIDEditRoute = AlbumsAlbumIDEditImport.update({
  id: '/albums/$albumID/edit',
  path: '/albums/$albumID/edit',
  getParentRoute: () => rootRoute,
} as any)

const AlbumsAlbumIDCreateRoute = AlbumsAlbumIDCreateImport.update({
  id: '/albums/$albumID/create',
  path: '/albums/$albumID/create',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/albums/': {
      id: '/albums/'
      path: '/albums'
      fullPath: '/albums'
      preLoaderRoute: typeof AlbumsIndexImport
      parentRoute: typeof rootRoute
    }
    '/albums/$albumID/create': {
      id: '/albums/$albumID/create'
      path: '/albums/$albumID/create'
      fullPath: '/albums/$albumID/create'
      preLoaderRoute: typeof AlbumsAlbumIDCreateImport
      parentRoute: typeof rootRoute
    }
    '/albums/$albumID/edit': {
      id: '/albums/$albumID/edit'
      path: '/albums/$albumID/edit'
      fullPath: '/albums/$albumID/edit'
      preLoaderRoute: typeof AlbumsAlbumIDEditImport
      parentRoute: typeof rootRoute
    }
    '/albums/$albumID/': {
      id: '/albums/$albumID/'
      path: '/albums/$albumID'
      fullPath: '/albums/$albumID'
      preLoaderRoute: typeof AlbumsAlbumIDIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/albums': typeof AlbumsIndexRoute
  '/albums/$albumID/create': typeof AlbumsAlbumIDCreateRoute
  '/albums/$albumID/edit': typeof AlbumsAlbumIDEditRoute
  '/albums/$albumID': typeof AlbumsAlbumIDIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/albums': typeof AlbumsIndexRoute
  '/albums/$albumID/create': typeof AlbumsAlbumIDCreateRoute
  '/albums/$albumID/edit': typeof AlbumsAlbumIDEditRoute
  '/albums/$albumID': typeof AlbumsAlbumIDIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/albums/': typeof AlbumsIndexRoute
  '/albums/$albumID/create': typeof AlbumsAlbumIDCreateRoute
  '/albums/$albumID/edit': typeof AlbumsAlbumIDEditRoute
  '/albums/$albumID/': typeof AlbumsAlbumIDIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/albums'
    | '/albums/$albumID/create'
    | '/albums/$albumID/edit'
    | '/albums/$albumID'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/albums'
    | '/albums/$albumID/create'
    | '/albums/$albumID/edit'
    | '/albums/$albumID'
  id:
    | '__root__'
    | '/'
    | '/albums/'
    | '/albums/$albumID/create'
    | '/albums/$albumID/edit'
    | '/albums/$albumID/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AlbumsIndexRoute: typeof AlbumsIndexRoute
  AlbumsAlbumIDCreateRoute: typeof AlbumsAlbumIDCreateRoute
  AlbumsAlbumIDEditRoute: typeof AlbumsAlbumIDEditRoute
  AlbumsAlbumIDIndexRoute: typeof AlbumsAlbumIDIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AlbumsIndexRoute: AlbumsIndexRoute,
  AlbumsAlbumIDCreateRoute: AlbumsAlbumIDCreateRoute,
  AlbumsAlbumIDEditRoute: AlbumsAlbumIDEditRoute,
  AlbumsAlbumIDIndexRoute: AlbumsAlbumIDIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/albums/",
        "/albums/$albumID/create",
        "/albums/$albumID/edit",
        "/albums/$albumID/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/albums/": {
      "filePath": "albums/index.tsx"
    },
    "/albums/$albumID/create": {
      "filePath": "albums/$albumID/create.tsx"
    },
    "/albums/$albumID/edit": {
      "filePath": "albums/$albumID/edit.tsx"
    },
    "/albums/$albumID/": {
      "filePath": "albums/$albumID/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
